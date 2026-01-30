import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import SetupAdmin from './pages/SetupAdmin';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup-admin" element={<SetupAdmin />} />

      {/* Admin Routes */}
      <Route path="/admin/*" element={<AdminDashboard />} />

      {/* Teacher Dashboard (placeholder) */}
      <Route
        path="/teacher/dashboard"
        element={<h1>Teacher Dashboard (Coming Soon)</h1>}
      />

      {/* Student Dashboard (placeholder) */}
      <Route
        path="/student/dashboard"
        element={<h1>Student Dashboard (Coming Soon)</h1>}
      />

      {/* 404 */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;
