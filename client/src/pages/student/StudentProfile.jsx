import React, { useState } from 'react';
import { 
  FaUser, 
  FaEnvelope, 
  FaIdCard, 
  FaCalendar, 
  FaMapMarkerAlt, 
  FaMobileAlt,
  FaShieldAlt,
  FaCheckCircle,
  FaLocationArrow,
  FaLock,
  FaUniversity,
  FaGraduationCap,
  FaEdit,
  FaBell,
  FaQrcode
} from 'react-icons/fa';

function StudentProfile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock student data - in real app, this would come from API
  const studentData = {
    enrollmentYear: '2023',
    semester: '4th',
    cgpa: '8.6',
    attendancePercentage: '92%',
    deviceCount: 1,
    lastLogin: '2 hours ago'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <FaUser className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Student Profile</h1>
                <p className="text-gray-600 mt-1">Manage your account and security settings</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 shadow-sm"
            >
              <FaEdit className="w-4 h-4" />
              Edit Profile
            </button>
            <button className="p-2.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <FaQrcode className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/40">
            <div className="relative h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              <div className="absolute -bottom-12 left-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center">
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {user.name?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                    <FaCheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-16 px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.name || 'Student Name'}</h2>
                  <p className="text-gray-600 mt-1">{user.email || 'student@college.edu'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium">
                      Student Account
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-medium">
                      Active
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Enrolled Since</p>
                    <p className="text-lg font-semibold text-gray-900">2023</p>
                  </div>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700 mb-1">Semester</p>
                  <p className="text-xl font-bold text-gray-900">{studentData.semester}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-100/50 p-4 rounded-xl border border-green-100">
                  <p className="text-sm text-green-700 mb-1">CGPA</p>
                  <p className="text-xl font-bold text-gray-900">{studentData.cgpa}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-100">
                  <p className="text-sm text-purple-700 mb-1">Attendance</p>
                  <p className="text-xl font-bold text-gray-900">{studentData.attendancePercentage}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-100">
                  <p className="text-sm text-amber-700 mb-1">Devices</p>
                  <p className="text-xl font-bold text-gray-900">{studentData.deviceCount}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Personal Information Grid */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                <FaUser className="w-4 h-4 text-blue-600" />
              </div>
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-xl border border-gray-200/50 hover:border-blue-200 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:scale-105 transition-transform">
                    <FaUser className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-semibold text-gray-900">{user.name || 'Not set'}</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-xl border border-gray-200/50 hover:border-blue-200 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-lg group-hover:scale-105 transition-transform">
                    <FaEnvelope className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="font-semibold text-gray-900">{user.email || 'Not set'}</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-xl border border-gray-200/50 hover:border-blue-200 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:scale-105 transition-transform">
                    <FaIdCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-semibold text-gray-900">{user.studentId || 'Not set'}</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-xl border border-gray-200/50 hover:border-blue-200 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:scale-105 transition-transform">
                    <FaGraduationCap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold text-gray-900">{user.department?.name || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Security & Settings */}
        <div className="space-y-6">
          {/* Device Security Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                  <FaShieldAlt className="w-4 h-4 text-blue-600" />
                </div>
                Device Security
              </h3>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-xl border border-blue-200/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <FaLock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Device Fingerprint</p>
                    <p className="text-sm text-blue-600">Active and verified</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">Last verified: {studentData.lastLogin}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Secure</span>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-100/30 rounded-xl border border-green-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <FaMobileAlt className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Security Status</p>
                    <p className="text-sm text-green-600">Device-locked for attendance</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
              Manage Devices
            </button>
          </div>
          
          {/* Location Settings Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                  <FaLocationArrow className="w-4 h-4 text-purple-600" />
                </div>
                Location Settings
              </h3>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-100/30 rounded-xl border border-purple-200/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <FaMapMarkerAlt className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-800">Location Access</p>
                    <p className="text-sm text-purple-600">Required for attendance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <FaBell className="w-3 h-3" />
                  <span>Always ask for permission</span>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-100/30 rounded-xl border border-cyan-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                    <FaUniversity className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-cyan-800">Campus Radius</p>
                    <p className="text-sm text-cyan-600">Must be within 50m radius</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full w-3/4"></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0m</span>
                    <span>50m allowed</span>
                    <span>100m</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2.5 text-sm font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors">
              Location Preferences
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-white/20 backdrop-blur-sm rounded-xl text-white text-sm hover:bg-white/30 transition-colors">
                <FaQrcode className="w-5 h-5 mx-auto mb-1" />
                Show QR Code
              </button>
              <button className="p-3 bg-white/20 backdrop-blur-sm rounded-xl text-white text-sm hover:bg-white/30 transition-colors">
                <FaShieldAlt className="w-5 h-5 mx-auto mb-1" />
                Privacy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;