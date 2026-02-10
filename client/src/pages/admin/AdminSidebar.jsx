import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaUserTie,
  FaUserGraduate,
  FaSignOutAlt,
  FaBook,
  FaCalendarAlt,
  FaChartBar,
  FaChevronRight,
  FaUniversity,
  FaUserCircle
} from "react-icons/fa";

function AdminSidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-300 ${
      isActive
        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform -translate-y-0.5"
        : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-700 hover:shadow-md"
    }`;

  return (
    <div className="w-64 bg-gradient-to-b from-white to-gray-50 shadow-2xl flex flex-col fixed left-0 top-0 bottom-0 border-r border-gray-200">
      {/* Scrollable Content Area */}
      <div className="p-5 flex-1 flex flex-col overflow-y-auto">
        {/* Header with improved styling */}
        <div className="mb-10 pt-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <FaUniversity className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-xs text-gray-500 font-medium">College Management System</p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <FaUserCircle className="text-xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation with improved styling */}
        <nav className="space-y-2 flex-1">
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
          </div>
          
          <NavLink to="/admin/dashboard" className={linkClass} end>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                window.location.pathname.includes('/dashboard') 
                  ? 'bg-white/20' 
                  : 'bg-blue-100 group-hover:bg-blue-200'
              }`}>
                <FaTachometerAlt className="text-lg" />
              </div>
              <span className="font-medium">Dashboard</span>
            </div>
            <FaChevronRight className={`text-sm transition-all duration-300 ${
              window.location.pathname.includes('/dashboard') 
                ? 'opacity-100' 
                : 'opacity-0 group-hover:opacity-50'
            }`} />
          </NavLink>

          <NavLink to="/admin/departments" className={linkClass}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                window.location.pathname.includes('/departments') 
                  ? 'bg-white/20' 
                  : 'bg-green-100 group-hover:bg-green-200'
              }`}>
                <FaUsers className="text-lg" />
              </div>
              <span className="font-medium">Departments</span>
            </div>
            <FaChevronRight className={`text-sm transition-all duration-300 ${
              window.location.pathname.includes('/departments') 
                ? 'opacity-100' 
                : 'opacity-0 group-hover:opacity-50'
            }`} />
          </NavLink>

          <NavLink to="/admin/teachers" className={linkClass}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                window.location.pathname.includes('/teachers') 
                  ? 'bg-white/20' 
                  : 'bg-purple-100 group-hover:bg-purple-200'
              }`}>
                <FaUserTie className="text-lg" />
              </div>
              <span className="font-medium">Teachers</span>
            </div>
            <FaChevronRight className={`text-sm transition-all duration-300 ${
              window.location.pathname.includes('/teachers') 
                ? 'opacity-100' 
                : 'opacity-0 group-hover:opacity-50'
            }`} />
          </NavLink>

          <NavLink to="/admin/students" className={linkClass}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                window.location.pathname.includes('/students') 
                  ? 'bg-white/20' 
                  : 'bg-amber-100 group-hover:bg-amber-200'
              }`}>
                <FaUserGraduate className="text-lg" />
              </div>
              <span className="font-medium">Students</span>
            </div>
            <FaChevronRight className={`text-sm transition-all duration-300 ${
              window.location.pathname.includes('/students') 
                ? 'opacity-100' 
                : 'opacity-0 group-hover:opacity-50'
            }`} />
          </NavLink>

          <NavLink to="/admin/subjects" className={linkClass}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                window.location.pathname.includes('/subjects') 
                  ? 'bg-white/20' 
                  : 'bg-emerald-100 group-hover:bg-emerald-200'
              }`}>
                <FaBook className="text-lg" />
              </div>
              <span className="font-medium">Subjects</span>
            </div>
            <FaChevronRight className={`text-sm transition-all duration-300 ${
              window.location.pathname.includes('/subjects') 
                ? 'opacity-100' 
                : 'opacity-0 group-hover:opacity-50'
            }`} />
          </NavLink>

          <NavLink to="/admin/class-schedules" className={linkClass}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                window.location.pathname.includes('/class-schedules') 
                  ? 'bg-white/20' 
                  : 'bg-rose-100 group-hover:bg-rose-200'
              }`}>
                <FaCalendarAlt className="text-lg" />
              </div>
              <span className="font-medium">Schedules</span>
            </div>
            <FaChevronRight className={`text-sm transition-all duration-300 ${
              window.location.pathname.includes('/class-schedules') 
                ? 'opacity-100' 
                : 'opacity-0 group-hover:opacity-50'
            }`} />
          </NavLink>

          <div className="px-3 mt-6 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Analytics</p>
          </div>

          <NavLink to="/admin/reports" className={linkClass}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                window.location.pathname.includes('/reports') 
                  ? 'bg-white/20' 
                  : 'bg-cyan-100 group-hover:bg-cyan-200'
              }`}>
                <FaChartBar className="text-lg" />
              </div>
              <span className="font-medium">Reports</span>
            </div>
            <FaChevronRight className={`text-sm transition-all duration-300 ${
              window.location.pathname.includes('/reports') 
                ? 'opacity-100' 
                : 'opacity-0 group-hover:opacity-50'
            }`} />
          </NavLink>
        </nav>

        {/* Logout Button with improved styling */}
        <div className="mt-auto pt-6 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded-xl hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:transform hover:-translate-y-0.5 group"
          >
            <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-300">
              <FaSignOutAlt className="text-sm" />
            </div>
            <span className="font-semibold">Logout</span>
            <div className="flex-1"></div>
            <FaChevronRight className="text-xs opacity-0 group-hover:opacity-100 transition-all duration-300" />
          </button>
          
          <div className="mt-4 px-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-medium">v1.0.0</span>
              <span className="text-gray-300">•</span>
              <span>College Attendance</span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient border */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
    </div>
  );
}

export default AdminSidebar;