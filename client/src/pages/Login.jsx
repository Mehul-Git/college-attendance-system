import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import API from '../services/api';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/auth/login', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password, // ✅ PLAIN PASSWORD
        role: formData.role
      });

      // Save auth data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

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
      setError(
        err.response?.data?.message ||
          'Login failed. Please check your credentials.'
      );
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
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
              <FaExclamationTriangle className="text-red-500 mt-1 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
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
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              🔒 Credentials are securely transmitted over HTTPS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
