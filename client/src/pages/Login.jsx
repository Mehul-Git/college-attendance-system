import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaLock, FaExclamationTriangle, FaFingerprint } from 'react-icons/fa';
import API from '../services/api';
import { getDeviceId, resetDeviceId } from '../utils/device'; // Import from utils

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
  const [deviceInfo, setDeviceInfo] = useState(null);

  // Initialize device info on component mount
  useEffect(() => {
    const initDevice = async () => {
      if (formData.role === 'student') {
        try {
          const deviceId = getDeviceId();
          setDeviceInfo({
            id: deviceId,
            shortId: deviceId.substring(0, 20) + '...'
          });
        } catch (err) {
          console.error('Failed to get device ID:', err);
        }
      }
    };
    
    initDevice();
  }, [formData.role]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get device fingerprint for student login
      let deviceId = null;
      if (formData.role === 'student') {
        deviceId = getDeviceId();
        console.log('📱 Login with Device Fingerprint:', deviceId.substring(0, 30) + '...');
      }

      const loginData = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        deviceId: deviceId // Send device fingerprint
      };

      console.log('📤 Login request:', {
        email: loginData.email,
        role: loginData.role,
        deviceId: deviceId ? deviceId.substring(0, 20) + '...' : 'none'
      });

      const response = await API.post('/auth/login', loginData);
      console.log('✅ Login successful');

      // Save auth data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Update deviceId from response if provided
      if (response.data.user?.deviceId) {
        localStorage.setItem('deviceFingerprint', response.data.user.deviceId);
      }

      // Clear password from memory
      setFormData((prev) => ({ ...prev, password: '' }));

      // Redirect by role
      switch (response.data.user.role) {
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
      console.error('❌ Login error:', err.response?.data);
      
      let errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      
      // Better device error messages
      if (errorMessage.includes('device') || errorMessage.includes('Device')) {
        errorMessage = (
          <div>
            <p className="font-medium">{errorMessage}</p>
            <p className="text-sm mt-2 text-red-600">
              This means you're trying to login from a different device/browser than the one you registered with.
            </p>
            <button
              type="button"
              onClick={() => {
                resetDeviceId();
                const newId = getDeviceId();
                setDeviceInfo({
                  id: newId,
                  shortId: newId.substring(0, 20) + '...'
                });
                alert('Device fingerprint reset. Try logging in again.');
              }}
              className="mt-2 px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
            >
              Reset Device Fingerprint
            </button>
          </div>
        );
      }
      
      setError(errorMessage);
      setFormData((prev) => ({ ...prev, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
              <FaLock className="text-blue-600 text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {formData.role
                ? `${formData.role.toUpperCase()} LOGIN`
                : 'LOGIN'}
            </h1>
            {!formData.role && (
              <p className="text-gray-600">
                Please select your role from the home page
              </p>
            )}
            {formData.role === 'student' && (
              <p className="text-sm text-green-600 mt-1 flex items-center justify-center gap-1">
                <FaFingerprint />
                Device fingerprinting enabled
              </p>
            )}
          </div>

          {/* Device Info */}
          {formData.role === 'student' && deviceInfo && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FaFingerprint className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Device Fingerprint</span>
              </div>
              <p className="text-xs text-blue-700 break-all">
                {deviceInfo.shortId}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                This unique ID identifies your device for secure login.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-red-500 mt-1 flex-shrink-0" />
                <div className="flex-1 text-red-700">{error}</div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!formData.role}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="you@college.edu"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={!formData.role}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Role (read-only) */}
              {formData.role && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    disabled
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-gray-100"
                  >
                    <option value="admin">Administrator</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading || !formData.role}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                  loading || !formData.role
                    ? 'bg-gray-400 cursor-not-allowed'
                    : formData.role === 'admin' 
                      ? 'bg-red-600 hover:bg-red-700'
                      : formData.role === 'teacher'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Authenticating...
                  </span>
                ) : (
                  `Login as ${formData.role}`
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              {formData.role === 'student' 
                ? '🔒 Device-locked security enabled' 
                : '🔒 Secure authentication'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;