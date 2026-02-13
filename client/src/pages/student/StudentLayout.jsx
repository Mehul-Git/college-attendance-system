import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  FaUserGraduate,
  FaSignOutAlt,
  FaCalendarAlt,
  FaHistory,
  FaHome,
  FaUser,
  FaBars,
  FaBell,
  FaChevronRight,
  FaTimes,
  FaCog,
  FaChartLine,
  FaMapMarkerAlt,
  FaClock
} from 'react-icons/fa';

import API from '../../services/api';

function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [notifications, setNotifications] = useState(3); // Mock notification count

  /* ============================
     🔁 FETCH ACTIVE SESSION (COOKIE AUTH)
  ============================ */
  useEffect(() => {
    fetchActiveSession();
  }, []);

  const fetchActiveSession = async () => {
    try {
      setLoadingSession(true);

      const res = await API.get('/attendance/active');

      if (res.data?.success) {
        setActiveSession(res.data.session);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      setActiveSession(null);
    } finally {
      setLoadingSession(false);
    }
  };

  /* ============================
     🚪 LOGOUT
  ============================ */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  /* ============================
     🧭 NAVIGATION - REMOVED MARK ATTENDANCE COMPLETELY
  ============================ */
  const navigation = [
    {
      name: 'Dashboard',
      href: '/student/dashboard',
      icon: <FaHome className="w-5 h-5" />,
      current: location.pathname === '/student/dashboard',
    },
    {
      name: 'Attendance History',
      href: '/student/history',
      icon: <FaHistory className="w-5 h-5" />,
      current: location.pathname === '/student/history',
    },
    {
      name: 'Profile',
      href: '/student/profile',
      icon: <FaUser className="w-5 h-5" />,
      current: location.pathname === '/student/profile',
    },
  ];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  /* ============================
     🧱 UI
  ============================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">

      {/* ================= MOBILE SIDEBAR ================= */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${mobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className={`absolute left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm shadow-2xl transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaUserGraduate className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Student Portal</h2>
                    <p className="text-sm text-blue-100">Attendance System</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl border-2 border-white/30 flex items-center justify-center">
                  <span className="font-bold text-blue-700 text-lg">
                    {user.name?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{user.name || 'Student'}</h3>
                  <p className="text-sm text-blue-100 opacity-90">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation - Only Dashboard, History, Profile */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                    item.current
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.current ? 'bg-gradient-to-r from-blue-100 to-indigo-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaChevronRight className="w-3 h-3 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="group w-full flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg"
              >
                <FaSignOutAlt className="w-5 h-5 group-hover:rotate-180 transition-transform" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 bg-white/95 backdrop-blur-sm border-r border-gray-200/50 shadow-2xl">
        <div className="flex flex-col w-full">
          {/* Sidebar Header */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FaUserGraduate className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white">Student Portal</h2>
                <p className="text-sm text-blue-100">Smart Attendance System</p>
              </div>
            </div>

            {/* Student Card */}
            <div className="relative p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl border-2 border-white/30 flex items-center justify-center">
                    <span className="font-bold text-blue-700 text-xl">
                      {user.name?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{user.name || 'Student'}</h3>
                  <p className="text-sm text-blue-100 opacity-90">{user.email}</p>
                </div>
              </div>
              {user.studentId && (
                <div className="mt-4 px-3 py-2 bg-white/20 rounded-lg">
                  <p className="text-sm text-white font-medium">ID: {user.studentId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation - Only Dashboard, History, Profile */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">Navigation</h3>
              <nav className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      item.current
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${item.current 
                        ? 'bg-gradient-to-r from-blue-100 to-indigo-100' 
                        : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaChevronRight className={`w-3 h-3 transition-transform ${item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1'}`} />
                    </div>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Active Session Info - Informational Only, No Mark Button */}
            {activeSession && !activeSession.hasMarked && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <FaClock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800">Active Session</h4>
                    <p className="text-sm text-blue-600">Attendance session in progress</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center justify-between">
                    <span>Subject:</span>
                    <span className="font-medium">{activeSession.subject?.name || 'Class Session'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Teacher:</span>
                    <span className="font-medium">{activeSession.teacher?.name || 'Not specified'}</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-blue-600 bg-white/50 p-2 rounded-lg">
                  ⚠️ Attendance can only be marked from the Dashboard
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="group w-full flex items-center justify-center gap-3 p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaSignOutAlt className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
              <span className="font-semibold">Logout Account</span>
            </button>
            
            {/* Time Display */}
            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-gray-900">{formatTime()}</p>
              <p className="text-xs text-gray-600 mt-1">{formatDate()}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="lg:pl-72">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 flex items-center justify-between px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaBars className="w-5 h-5 text-gray-700" />
            </button>
            
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-gray-900">{getGreeting()}!</h1>
              <p className="text-sm text-gray-600">Welcome to your student dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Display - Mobile */}
            <div className="md:hidden px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-700">{formatTime()}</p>
            </div>
            
            {/* Notification Bell */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group">
              <FaBell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {notifications}
                </span>
              )}
            </button>
            
            {/* User Profile Dropdown */}
            <div className="hidden md:flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <span className="font-bold text-blue-700">
                  {user.name?.charAt(0) || 'S'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name || 'Student'}</p>
                <p className="text-xs text-gray-500">Student Account</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 p-4 md:p-6 min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm p-4 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Student Attendance System • 
            <span className="text-blue-600 font-medium"> {user.department?.name || 'Department'}</span> • 
            Semester {user.semester || 'N/A'}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default StudentLayout;