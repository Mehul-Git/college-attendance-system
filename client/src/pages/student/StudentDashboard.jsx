import { Routes, Route, Navigate } from 'react-router-dom';
import StudentLayout from './StudentLayout';
import StudentHome from './StudentHome';
import MarkAttendance from './MarkAttendance';
import AttendanceHistory from './AttendanceHistory';
import StudentProfile from './StudentProfile'

function StudentDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user?.id) {
    return <Navigate to="/login?role=student" replace />;
  }

  if (user.role !== 'student') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      {/* 👇 Layout route */}
      <Route element={<StudentLayout />}>
        <Route index element={<StudentHome />} />
        <Route path="dashboard" element={<StudentHome />} />
        <Route path="mark/:sessionId" element={<MarkAttendance />} />
        <Route path="history" element={<AttendanceHistory />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default StudentDashboard;
