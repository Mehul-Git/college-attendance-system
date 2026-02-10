import { Navigate, Routes, Route } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
import TeacherSchedules from './TeacherSchedules';
import TeacherAttendanceStart from './TeacherAttendanceStart';

function TeacherDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // 🔐 Not logged in
  if (!token || !user?.id) {
    return <Navigate to="/login?role=teacher" replace />;
  }

  // 🔐 Not teacher
  if (user.role !== 'teacher') {
    return <Navigate to="/" replace />;
  }

  return (
    <TeacherLayout>
      <Routes>
        {/* Dashboard */}
        <Route index element={<TeacherSchedules />} />
        <Route path="dashboard" element={<TeacherSchedules />} />
        <Route path="schedules" element={<TeacherSchedules />} />

        {/* ✅ START ATTENDANCE ROUTE (CRITICAL FIX) */}
        <Route
          path="start/:scheduleId"
          element={<TeacherAttendanceStart />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </TeacherLayout>
  );
}

export default TeacherDashboard;
