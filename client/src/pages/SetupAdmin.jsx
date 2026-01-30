import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCheck, FaUniversity, FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import API from '../services/api';
import CryptoJS from 'crypto-js';

function SetupAdmin() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    collegeName: '',
    collegeAddress: ''
  });

  const steps = ['Admin Details', 'College Information', 'Confirmation'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Hash password with salt before sending
  const hashPassword = (password) => {
    const salt = process.env.REACT_APP_PASSWORD_SALT || 'college-attendance-2024';
    return CryptoJS.SHA256(password + salt).toString(CryptoJS.enc.Hex);
  };

  const validateStep1 = () => {
    const { name, email, password, confirmPassword } = formData;
    
    if (!name.trim()) {
      setError('Full name is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
      setError('Password must contain uppercase, lowercase, numbers, and special characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    setError('');
    return true;
  };
const handleSubmit = async () => {
  setLoading(true);
  setError('');

  try {
    const response = await API.post('/auth/setup-admin', {
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password, // ✅ PLAIN PASSWORD
      collegeName: formData.collegeName.trim(),
      collegeAddress: formData.collegeAddress.trim()
    });

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    setSuccess(true);
    setTimeout(() => navigate('/admin/dashboard'), 3000);
  } catch (err) {
    setError(err.response?.data?.message || 'Setup failed. Please try again.');
  } finally {
    setLoading(false);
  }
};


  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: 'Empty', color: 'gray' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    const strengths = [
      { label: 'Very Weak', color: 'red' },
      { label: 'Weak', color: 'orange' },
      { label: 'Fair', color: 'yellow' },
      { label: 'Good', color: 'lightgreen' },
      { label: 'Strong', color: 'green' },
      { label: 'Very Strong', color: 'darkgreen' }
    ];
    
    return strengths[Math.min(score, 5)];
  };

  const strength = getPasswordStrength(formData.password);

  // Step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <FaShieldAlt className="text-blue-600 text-2xl" />
              <h3 className="text-2xl font-bold text-gray-800">Administrator Account</h3>
            </div>
            
            <p className="text-gray-600">
              Create the primary administrator account for the College Attendance System.
              This account will have full system control.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="admin@college.edu"
                  required
                  autoComplete="email"
                />
                <p className="text-sm text-gray-500 mt-1">This will be your login email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Create a strong password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        Password strength: <span className={`font-bold text-${strength.color}-600`}>
                          {strength.label}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500">{formData.password.length}/20</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-${strength.color}-500 transition-all duration-300`}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      🔒 Must contain: uppercase, lowercase, numbers, special characters
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <FaUniversity className="text-blue-600 text-2xl" />
              <h3 className="text-2xl font-bold text-gray-800">College Information</h3>
            </div>
            
            <p className="text-gray-600">
              Provide details about your college. This information will be used for attendance geofencing.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College Name *
                </label>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter college name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College Address *
                </label>
                <textarea
                  name="collegeAddress"
                  value={formData.collegeAddress}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                  placeholder="Enter full college address"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus Latitude (Optional)
                  </label>
                  <input
                    type="text"
                    name="campusLat"
                    value={formData.campusLat || '28.6139'}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g., 28.6139"
                  />
                  <p className="text-sm text-gray-500 mt-1">For attendance geofencing</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus Longitude (Optional)
                  </label>
                  <input
                    type="text"
                    name="campusLon"
                    value={formData.campusLon || '77.2090'}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g., 77.2090"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Review & Confirm</h3>
            
            <p className="text-gray-600">
              Please review all information before creating the administrator account.
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500 block">Admin Name:</span>
                  <p className="font-semibold text-lg text-gray-800">{formData.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Email:</span>
                  <p className="font-semibold text-gray-800">{formData.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">College:</span>
                  <p className="font-semibold text-gray-800">{formData.collegeName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Address:</span>
                  <p className="font-semibold text-gray-800">{formData.collegeAddress}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="text-yellow-500 text-xl mt-1">⚠️</div>
                <div>
                  <h4 className="font-bold text-yellow-800 mb-2">Important Security Notice</h4>
                  <p className="text-yellow-700 mb-3">
                    You are creating the <strong>primary administrator account</strong> with full system privileges.
                  </p>
                  <ul className="list-disc pl-5 text-yellow-700 space-y-1 text-sm">
                    <li>This account cannot be deleted</li>
                    <li>You will have access to all system features</li>
                    <li>Keep your credentials secure and confidential</li>
                    <li>Use this account to create other admin accounts</li>
                    <li>Set up college location for attendance geofencing</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                🔒 <strong>Security Note:</strong> Your password is hashed before transmission and will be 
                securely stored using industry-standard bcrypt encryption.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center border border-green-200">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <FaCheck className="text-green-600 text-3xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">🎉 Setup Complete!</h2>
            <p className="text-gray-600 mb-6">
              Administrator account created successfully. You will be redirected to the dashboard in a moment.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              🔒 Your account is now secure and ready to use
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-3">🎓 First-Time Setup</h1>
            <p className="text-blue-100 text-lg">
              Initialize the College Attendance System
            </p>
          </div>

          {/* Stepper */}
          <div className="px-8 pt-8">
            <div className="flex justify-between items-center mb-8 relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
              {steps.map((step, index) => (
                <div key={step} className="flex flex-col items-center relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                    index === activeStep 
                      ? 'bg-blue-600 text-white border-blue-600 scale-110' 
                      : index < activeStep 
                      ? 'bg-green-500 text-white border-green-500' 
                      : 'bg-white text-gray-400 border-gray-300'
                  }`}>
                    {index < activeStep ? <FaCheck /> : index + 1}
                  </div>
                  <span className={`mt-3 font-medium ${
                    index === activeStep ? 'text-blue-600' : 
                    index < activeStep ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Step Content */}
            <div className="mb-8">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <button
                onClick={handleBack}
                disabled={activeStep === 0 || loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeStep === 0 || loading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                }`}
              >
                <FaArrowLeft /> Back
              </button>
              
              {activeStep === steps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Setup <FaCheck />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (activeStep === 0 && !validateStep1()) return;
                    handleNext();
                  }}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Next <FaArrowRight />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetupAdmin;