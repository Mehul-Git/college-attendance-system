import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { 
  FaTrash, 
  FaKey,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle 
} from 'react-icons/fa';

function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState({
    show: false,
    teacherId: null,
    teacherName: '',
    newPassword: ''
  });

  const token = localStorage.getItem('token');

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(res.data.teachers);
    } catch (err) {
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await API.get('/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(res.data.departments);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const createTeacher = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await API.post('/teachers', form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setForm({ name: '', email: '', password: '', department: '' });
      setSuccess('Teacher created successfully');
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create teacher');
    }
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;

    try {
      await API.delete(`/teachers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Teacher deleted successfully');
      fetchTeachers();
    } catch (err) {
      setError('Failed to delete teacher');
    }
  };

  const openResetPasswordModal = (teacher) => {
    setResetPasswordModal({
      show: true,
      teacherId: teacher._id,
      teacherName: teacher.name,
      newPassword: ''
    });
  };

  const closeResetPasswordModal = () => {
    setResetPasswordModal({
      show: false,
      teacherId: null,
      teacherName: '',
      newPassword: ''
    });
  };

  const handleResetPasswordChange = (e) => {
    setResetPasswordModal({
      ...resetPasswordModal,
      newPassword: e.target.value
    });
  };

  const resetTeacherPassword = async () => {
    if (!resetPasswordModal.newPassword || resetPasswordModal.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await API.post('/auth/admin/reset-password', {
        userId: resetPasswordModal.teacherId,
        newPassword: resetPasswordModal.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Password reset successfully for ${resetPasswordModal.teacherName}`);
      closeResetPasswordModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Teachers</h1>
        <p className="text-gray-600 mt-1">Create and manage teacher accounts</p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <FaExclamationCircle className="text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Create Teacher Form */}
      <form
        onSubmit={createTeacher}
        className="bg-white p-6 rounded-xl shadow-lg mb-8"
      >
        <h2 className="font-semibold text-lg mb-4">Add New Teacher</h2>

        <input
          name="name"
          placeholder="Full name"
          className="w-full border border-gray-300 p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full border border-gray-300 p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.password}
          onChange={handleChange}
          required
          minLength="6"
        />

        <select
          name="department"
          className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.department}
          onChange={handleChange}
          required
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Create Teacher
        </button>
      </form>

      {/* Teacher List */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Teacher List ({teachers.length} teachers)
          </h3>
        </div>

        {teachers.length === 0 ? (
          <p className="p-6 text-gray-500">No teachers found</p>
        ) : (
          teachers.map((t) => (
            <div
              key={t._id}
              className="flex justify-between items-center border-b p-4 hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <p className="text-sm text-gray-500">
                  {t.email} • {t.department?.name || 'No department'}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => openResetPasswordModal(t)}
                  className="flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                  title="Reset Password"
                >
                  <FaKey className="mr-2" />
                  Reset Password
                </button>
                <button
                  onClick={() => deleteTeacher(t._id)}
                  className="flex items-center text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                  title="Delete Teacher"
                >
                  <FaTrash className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reset Password Modal */}
      {resetPasswordModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reset Password
              </h3>
              <p className="text-gray-600 mb-4">
                Set a new password for <span className="font-medium">{resetPasswordModal.teacherName}</span>
              </p>
              
              <input
                type="password"
                placeholder="New password (min. 6 characters)"
                className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={resetPasswordModal.newPassword}
                onChange={handleResetPasswordChange}
                minLength="6"
              />
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeResetPasswordModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={resetTeacherPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTeachers;