import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import SetupAdmin from './pages/SetupAdmin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup-admin" element={<SetupAdmin />} />
        
        {/* Add these placeholder routes for now */}
        <Route path="/admin/dashboard" element={<h1>Admin Dashboard (Coming Soon)</h1>} />
        <Route path="/teacher/dashboard" element={<h1>Teacher Dashboard (Coming Soon)</h1>} />
        <Route path="/student/dashboard" element={<h1>Student Dashboard (Coming Soon)</h1>} />
        
        {/* 404 page */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;