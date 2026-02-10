import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import SetupAdmin from "./pages/SetupAdmin";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendanceStart from "./pages/teacher/TeacherAttendanceStart";
import StudentDashboard from './pages/student/StudentDashboard';
import deviceService from './services/deviceService';

// Teacher components
import TeacherSchedules from "./pages/teacher/TeacherSchedules";


// Initialize device fingerprinting early (non-blocking)
deviceService.init().catch(err => {
  console.warn('Device fingerprint initialization failed:', err);
});


function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup-admin" element={<SetupAdmin />} />

      {/* Admin Routes */}
      <Route path="/admin/*" element={<AdminDashboard />} />

      {/* Teacher Routes - FIXED: Add trailing * */}
      <Route path="/teacher/*" element={<TeacherDashboard />} />
      
      {/* Separate attendance route */}
      <Route 
        path="/teacher/attendance/:scheduleId" 
        element={<TeacherAttendanceStart />} 
      />

      {/* Student Routes */}
      <Route path="/student/*" element={<StudentDashboard />} />

      {/* 404 */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;