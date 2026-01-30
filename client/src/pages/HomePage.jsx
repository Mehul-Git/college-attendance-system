import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSchool, FaChalkboardTeacher, FaUserGraduate, FaUserShield } from 'react-icons/fa';
import API from '../services/api';

function HomePage() {
  const navigate = useNavigate();
  const [isFirstTime, setIsFirstTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFirstTimeSetup();
  }, []);

  const checkFirstTimeSetup = async () => {
    try {
      const response = await API.get('/auth/first-time-check');
      setIsFirstTime(response.data.isFirstTime);
    } catch (error) {
      console.error('Error checking setup:', error);
      setIsFirstTime(true);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      title: 'Admin',
      icon: <FaUserShield className="text-5xl text-blue-600" />,
      description: 'Manage departments, classes, teachers, and students',
      color: 'bg-blue-600 hover:bg-blue-700 border-blue-600',
      textColor: 'text-blue-600',
      path: isFirstTime ? '/setup-admin' : '/login?role=admin'
    },
    {
      title: 'Teacher',
      icon: <FaChalkboardTeacher className="text-5xl text-purple-600" />,
      description: 'Take attendance, view student records, generate reports',
      color: 'bg-purple-600 hover:bg-purple-700 border-purple-600',
      textColor: 'text-purple-600',
      path: '/login?role=teacher',
      disabled: isFirstTime
    },
    {
      title: 'Student',
      icon: <FaUserGraduate className="text-5xl text-green-600" />,
      description: 'Mark attendance, view your attendance history',
      color: 'bg-green-600 hover:bg-green-700 border-green-600',
      textColor: 'text-green-600',
      path: '/login?role=student',
      disabled: isFirstTime
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎓 College Attendance System
          </h1>
          <p className="text-xl opacity-90">
            Secure • Efficient • Automated
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isFirstTime && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <div className="flex items-center">
              <FaUserShield className="text-blue-500 text-2xl mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800">
                  First-Time Setup Required
                </h3>
                <p className="text-blue-700">
                  This is the first time the system is being accessed. 
                  Please create the primary administrator account to get started.
                  After setup, only admins can create teacher and student accounts.
                </p>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
          {isFirstTime ? 'Create First Administrator' : 'Select Your Role'}
        </h2>
        <p className="text-gray-600 text-center mb-8">
          {isFirstTime 
            ? 'Set up the system administrator account to begin'
            : 'Login with your credentials provided by the administration'}
        </p>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {roles.map((role) => (
            <div 
              key={role.title} 
              className={`bg-white rounded-xl shadow-lg border-t-4 ${role.textColor} border-t-4 transition-transform duration-300 hover:-translate-y-2 ${
                role.disabled ? 'opacity-60' : ''
              }`}
            >
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  {role.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">
                  {role.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {role.description}
                </p>
                
                {role.disabled && isFirstTime && (
                  <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-700 text-sm">
                      ⚠️ Available after admin setup
                    </p>
                  </div>
                )}

                <button
                  onClick={() => navigate(role.path)}
                  disabled={role.disabled}
                  className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-colors ${role.color} ${
                    role.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                >
                  {isFirstTime && role.title === 'Admin' ? 'Setup Administrator' : `Login as ${role.title}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-gray-600 space-y-2">
          <p className="flex items-center justify-center gap-2">
            <span className="text-blue-500">🔐</span>
            {isFirstTime 
              ? 'First admin account has full system control' 
              : 'All accounts are created by system administrators'}
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="text-green-500">📍</span>
            Attendance can only be marked from within college campus
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;