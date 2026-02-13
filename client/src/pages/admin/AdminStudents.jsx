import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { 
  FaUserGraduate, 
  FaTrash, 
  FaKey, 
  FaMobileAlt,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle 
} from 'react-icons/fa';

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    semester: '',
    section: 'A'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [resetModal, setResetModal] = useState({
    show: false,
    studentId: null,
    studentName: '',
    type: 'password', // 'password' or 'device'
    newPassword: '',
    resetDeviceId: false
  });

  const token = localStorage.getItem('token');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await API.get('/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.students);
    } catch (err) {
      setError('Failed to load students');
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
    fetchStudents();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.email || !form.password || !form.department || !form.semester) {
      setError('All fields are required');
      return;
    }

    if (form.semester < 1 || form.semester > 8) {
      setError('Semester must be between 1 and 8');
      return;
    }

    try {
      if (editingId) {
        await API.patch(`/students/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Student updated successfully');
      } else {
        await API.post('/students', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Student created successfully');
      }

      setForm({
        name: '',
        email: '',
        password: '',
        department: '',
        semester: '',
        section: 'A'
      });
      setEditingId(null);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await API.delete(`/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      setError('Failed to delete student');
    }
  };

  const openResetModal = (student, type) => {
    setResetModal({
      show: true,
      studentId: student._id,
      studentName: student.name,
      type: type,
      newPassword: '',
      resetDeviceId: false
    });
  };

  const closeResetModal = () => {
    setResetModal({
      show: false,
      studentId: null,
      studentName: '',
      type: 'password',
      newPassword: '',
      resetDeviceId: false
    });
  };

  const handleResetModalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setResetModal({
      ...resetModal,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleResetAction = async () => {
    try {
      if (resetModal.type === 'password') {
        if (!resetModal.newPassword || resetModal.newPassword.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }

        await API.post('/auth/admin/reset-password', {
          userId: resetModal.studentId,
          newPassword: resetModal.newPassword
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSuccess(`Password reset successfully for ${resetModal.studentName}`);
      } else if (resetModal.type === 'device') {
        if (resetModal.resetDeviceId) {
          await API.post('/auth/admin/reset-device-id', {
            studentId: resetModal.studentId
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          setSuccess(`Device ID reset successfully for ${resetModal.studentName}`);
        } else {
          setError('Please check the confirmation box to reset device ID');
          return;
        }
      }

      closeResetModal();
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform reset');
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
        <h1 className="text-2xl font-bold text-gray-900">Manage Students</h1>
        <p className="text-gray-600 mt-1">Create and manage student accounts</p>
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

      {/* Create/Edit Student Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FaUserGraduate className="mr-2 text-blue-600" />
          {editingId ? 'Edit Student' : 'Add New Student'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                name="email"
                type="email"
                placeholder="student@college.edu"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingId ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.password}
                onChange={handleChange}
                required={!editingId}
                minLength="6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                name="department"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
              <select
                name="semester"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.semester}
                onChange={handleChange}
                required
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                name="section"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.section}
                onChange={handleChange}
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    name: '',
                    email: '',
                    password: '',
                    department: '',
                    semester: '',
                    section: 'A'
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {editingId ? 'Update Student' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Student List ({students.length} students)
          </h3>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center">
            <FaUserGraduate className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No students found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first student above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                          <div className="text-xs text-gray-400">ID: {student.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.department?.name || 'Not assigned'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Semester {student.semester || 'N/A'}
                        </span>
                        {student.section && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Sec {student.section}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaMobileAlt className={`mr-2 ${student.deviceId ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${student.deviceId ? 'text-green-600' : 'text-gray-500'}`}>
                          {student.deviceId ? 'Device Registered' : 'No Device'}
                        </span>
                        {student.deviceId && (
                          <span className="ml-2 text-xs text-gray-400 truncate max-w-[100px]" title={student.deviceId}>
                            {student.deviceId.substring(0, 15)}...
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openResetModal(student, 'password')}
                          className="flex items-center text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <FaKey className="mr-1" />
                          <span className="hidden md:inline">Password</span>
                        </button>
                        <button
                          onClick={() => openResetModal(student, 'device')}
                          className="flex items-center text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg transition-colors"
                          title="Reset Device ID"
                        >
                          <FaMobileAlt className="mr-1" />
                          <span className="hidden md:inline">Device</span>
                        </button>
                        <button
                          onClick={() => handleDelete(student._id)}
                          className="flex items-center text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                          title="Delete Student"
                        >
                          <FaTrash className="mr-1" />
                          <span className="hidden md:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Modal */}
      {resetModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {resetModal.type === 'password' ? 'Reset Password' : 'Reset Device ID'}
              </h3>
              <p className="text-gray-600 mb-4">
                {resetModal.type === 'password' 
                  ? `Set a new password for ${resetModal.studentName}`
                  : `Reset device ID for ${resetModal.studentName}. This will allow them to login from a new device.`
                }
              </p>
              
              {resetModal.type === 'password' ? (
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New password (min. 6 characters)"
                  className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={resetModal.newPassword}
                  onChange={handleResetModalChange}
                  minLength="6"
                />
              ) : (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <FaExclamationCircle className="text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-yellow-800 font-medium mb-1">Warning</p>
                      <p className="text-yellow-700 text-sm">
                        Resetting device ID will allow this student to login from any device.
                        Only do this if they have lost access to their registered device.
                      </p>
                      <label className="flex items-center mt-3">
                        <input
                          type="checkbox"
                          name="resetDeviceId"
                          checked={resetModal.resetDeviceId}
                          onChange={handleResetModalChange}
                          className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-yellow-800">I confirm I want to reset the device ID</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeResetModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetAction}
                  className={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 ${
                    resetModal.type === 'password' 
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                      : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                  }`}
                >
                  {resetModal.type === 'password' ? 'Reset Password' : 'Reset Device ID'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStudents;