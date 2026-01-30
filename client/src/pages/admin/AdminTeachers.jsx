import React, { useEffect, useState } from 'react';
import API from '../../services/api';

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

  const token = localStorage.getItem('token');

  const fetchTeachers = async () => {
    const res = await API.get('/teachers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTeachers(res.data.teachers);
  };

  const fetchDepartments = async () => {
    const res = await API.get('/departments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDepartments(res.data.departments);
  };

  useEffect(() => {
    fetchTeachers();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createTeacher = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await API.post('/teachers', form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setForm({ name: '', email: '', password: '', department: '' });
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create teacher');
    }
  };

  const deleteTeacher = async (id) => {
    if (!confirm('Delete this teacher?')) return;

    await API.delete(`/teachers/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchTeachers();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Teachers</h1>

      {/* Create Teacher */}
      <form
        onSubmit={createTeacher}
        className="bg-white p-6 rounded-xl shadow mb-8"
      >
        <h2 className="font-semibold mb-4">Add Teacher</h2>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <input
          name="name"
          placeholder="Full name"
          className="w-full border p-3 rounded mb-3"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded mb-3"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded mb-3"
          value={form.password}
          onChange={handleChange}
          required
        />

        <select
          name="department"
          className="w-full border p-3 rounded mb-4"
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

        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Create Teacher
        </button>
      </form>

      {/* Teacher List */}
      <div className="bg-white rounded-xl shadow">
        {teachers.length === 0 ? (
          <p className="p-6 text-gray-500">No teachers found</p>
        ) : (
          teachers.map((t) => (
            <div
              key={t._id}
              className="flex justify-between items-center border-b p-4"
            >
              <div>
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-sm text-gray-500">
                  {t.email} • {t.department?.name}
                </p>
              </div>

              <button
                onClick={() => deleteTeacher(t._id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminTeachers;
