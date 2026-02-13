import React, { useState } from 'react';
import { FaShieldAlt, FaQuestionCircle, FaEnvelope, FaLock } from 'react-icons/fa';
import API from '../../services/api';

function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState('email'); // email | setup | question
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const resetState = () => {
    setStep('email');
    setEmail('');
    setSecurityQuestion('');
    setAvailableQuestions([]);
    setSelectedQuestion('');
    setAnswer('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  /* ========================================
     STEP 1 — CHECK EMAIL
  ======================================== */
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.get(
        `/auth/security-question/${encodeURIComponent(email)}`
      );

      if (response.data.needsSetup) {
        setAvailableQuestions(response.data.availableQuestions || []);
        setStep('setup');
      } else {
        setSecurityQuestion(response.data.question);
        setStep('question');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  /* ========================================
     STEP 2 — SET SECURITY QUESTION (FIRST TIME)
  ======================================== */
  const handleSetSecurityQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedQuestion || !answer.trim()) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      await API.post('/auth/set-security-question', {
        email,
        question: selectedQuestion,
        answer: answer.trim(),
      });

      setSuccess('Security question set successfully!');
      setTimeout(() => {
        setStep('email');
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set security question');
    } finally {
      setLoading(false);
    }
  };

  /* ========================================
     STEP 3 — VERIFY ANSWER + RESET PASSWORD
  ======================================== */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!answer || !newPassword || !confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await API.post('/auth/verify-security-reset', {
        email,
        answer,
        newPassword,
      });

      setSuccess(response.data.message);

      setTimeout(() => {
        handleClose();
        window.location.href = '/login?role=admin';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  /* ========================================
     UI STEPS
  ======================================== */

  const renderEmailStep = () => (
    <form onSubmit={handleCheckEmail} className="space-y-6">
      <div className="text-center">
        <FaShieldAlt className="mx-auto text-3xl text-blue-600 mb-2" />
        <h3 className="text-lg font-semibold">Forgot Password</h3>
        <p className="text-sm text-gray-600">
          Enter your admin email to continue
        </p>
      </div>

      <div className="relative">
        <FaEnvelope className="absolute left-3 top-4 text-gray-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 py-3 border rounded-lg"
          placeholder="admin@college.edu"
          required
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        className="w-full py-3 bg-blue-600 text-white rounded-lg"
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Continue'}
      </button>
    </form>
  );

  const renderSetupStep = () => (
    <form onSubmit={handleSetSecurityQuestion} className="space-y-4">
      <h3 className="text-lg font-semibold text-center">
        Setup Security Question
      </h3>

      <select
        value={selectedQuestion}
        onChange={(e) => setSelectedQuestion(e.target.value)}
        className="w-full p-3 border rounded-lg"
        required
      >
        <option value="">Select a question</option>
        {availableQuestions.map((q, i) => (
          <option key={i} value={q}>
            {q}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Your answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="w-full p-3 border rounded-lg"
        required
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <button
        type="submit"
        className="w-full py-3 bg-blue-600 text-white rounded-lg"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );

  const renderQuestionStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <h3 className="text-lg font-semibold text-center">
        Reset Your Password
      </h3>

      <div className="bg-blue-50 p-3 rounded-lg text-sm">
        <strong>Security Question:</strong>
        <p>{securityQuestion}</p>
      </div>

      <input
        type="text"
        placeholder="Your Answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="w-full p-3 border rounded-lg"
        required
      />

      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full p-3 border rounded-lg"
        required
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full p-3 border rounded-lg"
        required
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <button
        type="submit"
        className="w-full py-3 bg-green-600 text-white rounded-lg"
        disabled={loading}
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-96 p-6 rounded-xl shadow-lg">
        {step === 'email' && renderEmailStep()}
        {step === 'setup' && renderSetupStep()}
        {step === 'question' && renderQuestionStep()}

        <button
          onClick={handleClose}
          className="mt-4 text-sm text-gray-500 hover:underline w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
