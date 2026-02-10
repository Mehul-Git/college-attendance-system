import React, { useEffect, useState } from 'react';
import API from '../../services/api';

function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    department: '',
    teacher: ''
  });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchSubjects = async () => {
    const res = await API.get('/subjects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSubjects(res.data.subjects);
  };

  const fetchDepartments = async () => {
    const res = await API.get('/departments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDepartments(res.data.departments);
  };

  const fetchTeachers = async () => {
    const res = await API.get('/teachers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTeachers(res.data.teachers);
  };

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
    fetchTeachers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createSubject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await API.post('/subjects', form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setForm({ name: '', code: '', department: '', teacher: '' });
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject');
    }
  };

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject?')) return;

    await API.delete(`/subjects/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchSubjects();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subjects</h1>

      {/* Create Subject */}
      <form
        onSubmit={createSubject}
        className="bg-white p-6 rounded-xl shadow mb-8"
      >
        <h2 className="font-semibold mb-4">Add Subject</h2>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <input
          name="name"
          placeholder="Subject name"
          className="w-full border p-3 rounded mb-3"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="code"
          placeholder="Subject code (e.g. CS101)"
          className="w-full border p-3 rounded mb-3 uppercase"
          value={form.code}
          onChange={handleChange}
          required
        />

        <select
          name="department"
          className="w-full border p-3 rounded mb-3"
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

        <select
          name="teacher"
          className="w-full border p-3 rounded mb-4"
          value={form.teacher}
          onChange={handleChange}
          required
        >
          <option value="">Select Teacher</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>

        <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
          Create Subject
        </button>
      </form>

      {/* Subject List */}
      <div className="bg-white rounded-xl shadow">
        {subjects.length === 0 ? (
          <p className="p-6 text-gray-500">No subjects found</p>
        ) : (
          subjects.map((s) => (
            <div
              key={s._id}
              className="flex justify-between items-center border-b p-4"
            >
              <div>
                <h3 className="font-semibold">{s.name} ({s.code})</h3>
                <p className="text-sm text-gray-500">
                  {s.department?.name} • {s.teacher?.name}
                </p>
              </div>

              <button
                onClick={() => deleteSubject(s._id)}
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

export default AdminSubjects;
