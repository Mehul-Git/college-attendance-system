import React, { useEffect, useState } from 'react';
import API from '../../services/api';

function AdminDepartments() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchDepartments = async () => {
    const res = await API.get('/departments', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setDepartments(res.data.departments);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const createDepartment = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await API.post(
        '/departments',
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setName('');
      setDescription('');
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  const deleteDepartment = async (id) => {
    if (!confirm('Delete this department?')) return;

    await API.delete(`/departments/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    fetchDepartments();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Departments</h1>

      {/* Create Form */}
      <form onSubmit={createDepartment} className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Department</h2>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <input
          type="text"
          placeholder="Department name"
          className="w-full border p-3 rounded mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <textarea
          placeholder="Description (optional)"
          className="w-full border p-3 rounded mb-3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Creating...' : 'Create Department'}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl shadow">
        {departments.length === 0 ? (
          <p className="p-6 text-gray-500">No departments found</p>
        ) : (
          departments.map((dept) => (
            <div
              key={dept._id}
              className="flex justify-between items-center border-b p-4"
            >
              <div>
                <h3 className="font-semibold">{dept.name}</h3>
                <p className="text-sm text-gray-500">{dept.description}</p>
              </div>

              <button
                onClick={() => deleteDepartment(dept._id)}
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

export default AdminDepartments;
