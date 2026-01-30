import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminHome from './AdminHome';
import AdminTeachers from './AdminTeachers';
import AdminStudents from './AdminStudents';
import AdminDepartments from './AdminDepartments'

function AdminDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // 🔐 Not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 🔐 Not admin
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <Routes>
        {/* ✅ DEFAULT ADMIN ROUTE */}
        <Route index element={<AdminHome />} />

        {/* Explicit dashboard route */}
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="students" element={<AdminStudents />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default AdminDashboard;
