import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaQuestionCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import API from '../../services/api';

function AdminProfile() {
  const [user, setUser] = useState(null);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [confirmAnswer, setConfirmAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [availableQuestions] = useState([
    'What was your childhood nickname?',
    'What is the name of your first pet?',
    'What was your first car?',
    'What elementary school did you attend?',
    'What is the name of the town where you were born?',
    'What is your mother\'s maiden name?',
    'What is your favorite book?',
    'What is your favorite movie?'
  ]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  }, []);

  const handleSetSecurityQuestion = async (e) => {
    e.preventDefault();
    
    if (!securityQuestion) {
      setMessage({ type: 'error', text: 'Please select a security question' });
      return;
    }

    if (!securityAnswer.trim()) {
      setMessage({ type: 'error', text: 'Please enter an answer' });
      return;
    }

    if (securityAnswer !== confirmAnswer) {
      setMessage({ type: 'error', text: 'Answers do not match' });
      return;
    }

    if (securityAnswer.length < 2) {
      setMessage({ type: 'error', text: 'Answer must be at least 2 characters' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await API.post('/auth/update-security-question', {
        question: securityQuestion,
        answer: securityAnswer.trim()
      });

      setMessage({ 
        type: 'success', 
        text: 'Security question set successfully! You can now use it to reset your password if needed.' 
      });

      // Clear form
      setSecurityQuestion('');
      setSecurityAnswer('');
      setConfirmAnswer('');
    } catch (error) {
      console.error('Error setting security question:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to set security question. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-white">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
              <p className="text-gray-600 text-sm mb-2">{user?.email}</p>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                Administrator
              </span>
              {user?.isSuperAdmin && (
                <span className="inline-block ml-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                  Super Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Security Question Setup */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <FaShieldAlt className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>
                <p className="text-sm text-gray-600">
                  Set up password recovery security question
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong className="font-medium">Important:</strong> Setting a security question allows you to reset your password without admin assistance. Keep your answer secure and memorable.
                  </p>
                </div>
              </div>
            </div>

            {message.text && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <FaCheckCircle className="text-green-500 mr-2" />
                  ) : (
                    <FaExclamationTriangle className="text-red-500 mr-2" />
                  )}
                  <p className={`text-sm ${
                    message.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSetSecurityQuestion} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaQuestionCircle className="inline mr-2 text-blue-500" />
                  Security Question
                </label>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">Select a security question</option>
                  {availableQuestions.map((q, index) => (
                    <option key={index} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your answer"
                  disabled={loading}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Answer is case-insensitive and will be securely hashed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Answer
                </label>
                <input
                  type="text"
                  value={confirmAnswer}
                  onChange={(e) => setConfirmAnswer(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your answer"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Set Security Question'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;