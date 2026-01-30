import React, { useEffect, useState } from 'react';
import API from '../../services/api';

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: ''
  });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchStudents = async () => {
    const res = await API.get('/students', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStudents(res.data.students);
  };

  const fetchDepartments = async () => {
    const res = await API.get('/departments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDepartments(res.data.departments);
  };

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createStudent = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await API.post('/students', form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setForm({ name: '', email: '', password: '', department: '' });
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create student');
    }
  };

  const deleteStudent = async (id) => {
    if (!confirm('Delete this student?')) return;

    await API.delete(`/students/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchStudents();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Students</h1>

      {/* Create Student */}
      <form
        onSubmit={createStudent}
        className="bg-white p-6 rounded-xl shadow mb-8"
      >
        <h2 className="font-semibold mb-4">Add Student</h2>

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

        <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
          Create Student
        </button>
      </form>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow">
        {students.length === 0 ? (
          <p className="p-6 text-gray-500">No students found</p>
        ) : (
          students.map((s) => (
            <div
              key={s._id}
              className="flex justify-between items-center border-b p-4"
            >
              <div>
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-sm text-gray-500">
                  {s.email} • {s.department?.name} • {s.studentId}
                </p>
              </div>

              <button
                onClick={() => deleteStudent(s._id)}
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

export default AdminStudents;
