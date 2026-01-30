import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import API from '../services/api';
import CryptoJS from 'crypto-js';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const roleFromURL = queryParams.get('role') || '';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: roleFromURL
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Hash password with salt before sending
  const hashPassword = (password) => {
    const salt = process.env.REACT_APP_PASSWORD_SALT || 'college-attendance-2024';
    return CryptoJS.SHA256(password + salt).toString(CryptoJS.enc.Hex);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Hash password before sending to backend
      const hashedPassword = hashPassword(formData.password);
      
      const response = await API.post('/auth/login', {
        email: formData.email.toLowerCase().trim(),
        password: hashedPassword, // Send hashed password, not plain text
        role: formData.role
      });
      
      // Store auth data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Clear password from state
      setFormData(prev => ({ ...prev, password: '' }));
      
      // Redirect based on role
      switch(response.data.user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      // Clear password on error
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
              <FaLock className="text-blue-600 text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {formData.role ? `${formData.role.toUpperCase()} LOGIN` : 'LOGIN'}
            </h1>
            {!formData.role && (
              <p className="text-gray-600">
                Please select your role from the home page
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-shake">
              <FaExclamationTriangle className="text-red-500 mt-1 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!formData.role}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                    placeholder="you@college.edu"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={!formData.role}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Role Display (Read-only) */}
              {formData.role && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 appearance-none"
                    >
                      <option value="admin">Administrator</option>
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading || !formData.role}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                  loading || !formData.role
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-3">
            <p className="text-gray-600 text-sm">
              {formData.role === 'student' && '📝 Your credentials are provided by college administration'}
              {formData.role === 'teacher' && '👨‍🏫 Contact admin if you forgot your password'}
              {formData.role === 'admin' && '🔐 First admin? Go to home page for initial setup'}
            </p>
            <p className="text-xs text-gray-500">
              🔒 Passwords are securely hashed before transmission
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;