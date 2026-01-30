import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaUsers,
  FaUserTie,
  FaUserGraduate,
  FaSignOutAlt
} from 'react-icons/fa';

function AdminSidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-blue-100'
    }`;

  return (
    <div className="w-64 bg-white shadow-lg p-4">
      {/* Logo */}
      <h1 className="text-2xl font-bold text-blue-600 mb-8 text-center">
        Admin Panel
      </h1>

      {/* Navigation */}
      <nav className="space-y-2">
        <NavLink to="/admin/dashboard" className={linkClass}>
          <FaTachometerAlt />
          Dashboard
        </NavLink>

        <NavLink to="/admin/teachers" className={linkClass}>
          <FaUserTie />
          Teachers
        </NavLink>

        <NavLink to="/admin/students" className={linkClass}>
          <FaUserGraduate />
          Students
        </NavLink>

        <NavLink to="/admin/departments" className={linkClass}>
          <FaUsers />
          Departments
        </NavLink>
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="mt-10 w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        <FaSignOutAlt />
        Logout
      </button>
    </div>
  );
}

export default AdminSidebar;
