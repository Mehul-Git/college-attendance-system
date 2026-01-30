import React from 'react';

function AdminHome() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div>
      {/* Welcome */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Welcome, {user?.name} 👋
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Total Teachers</h2>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Total Students</h2>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Departments</h2>
          <p className="text-3xl font-bold text-purple-600">0</p>
        </div>
      </div>

      {/* Info */}
      <div className="mt-10 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-blue-700">
          Use the sidebar to manage teachers, students, and departments.
        </p>
      </div>
    </div>
  );
}

export default AdminHome;
