import { useEffect, useState } from 'react';
import API from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaCalendarCheck, 
  FaExclamationCircle, 
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUserTie,
  FaBook,
  FaArrowRight,
  FaSync,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaHistory,
  FaUser,
  FaChartLine,
  FaBell,
  FaRocket
} from 'react-icons/fa';

function StudentHome() {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveSession();
    // Load student info from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setStudentInfo(userData);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!activeSession || !activeSession.endTime) return;
    
    const updateTimer = () => {
      const endTime = new Date(activeSession.endTime);
      const now = new Date();
      const diffMs = endTime - now;
      setTimeLeft(Math.max(0, Math.floor(diffMs / 1000)));
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const fetchActiveSession = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const res = await API.get('/attendance/active');
      
      if (res.data.success) {
        setActiveSession(res.data.session);
      } else {
        setError(res.data.message || 'No active session found');
        setActiveSession(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load session data');
      setActiveSession(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper functions
  const getSessionId = () => activeSession?.id || activeSession?._id || null;
  const isAttendanceMarked = () => activeSession?.hasMarked || activeSession?.alreadyMarked || false;
  const getSubjectName = () => activeSession?.subject?.name || activeSession?.classSchedule?.subject?.name || 'Class Session';
  const getTeacherName = () => activeSession?.teacher?.name || activeSession?.classSchedule?.teacher?.name || 'Not specified';
  
  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeLeft = (seconds) => {
    if (seconds <= 0) return { expired: true, minutes: 0, seconds: 0 };
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { expired: false, minutes, seconds: secs };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-6">
            <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Preparing your student workspace...</p>
        </div>
      </div>
    );
  }

  const sessionId = getSessionId();
  const attendanceMarked = isAttendanceMarked();
  const subjectName = getSubjectName();
  const teacherName = getTeacherName();
  const timeRemaining = formatTimeLeft(timeLeft);
  const isSessionExpired = timeRemaining.expired;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaRocket className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <FaBell className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, {studentInfo?.name || 'Student'}!</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/40">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                Semester {studentInfo?.semester || 'N/A'} • Section {studentInfo?.section || 'N/A'}
              </span>
            </div>
            
            <button
              onClick={fetchActiveSession}
              disabled={refreshing}
              className="group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 shadow-sm"
              >
                <FaSync className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {error && !activeSession && (
        <div className="mb-6 transform transition-all duration-300 animate-slideIn">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                <FaExclamationCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-800">No Active Sessions</h3>
                <p className="text-sm text-amber-700 mt-1">{error}</p>
                {studentInfo && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center px-3 py-1 bg-white/80 rounded-full text-xs font-medium text-amber-800">
                      {studentInfo.department?.name || 'Department not set'}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 bg-white/80 rounded-full text-xs font-medium text-amber-800">
                      Semester {studentInfo.semester || 'N/A'}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 bg-white/80 rounded-full text-xs font-medium text-amber-800">
                      Section {studentInfo.section || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Section */}
      <div className="mb-8 transform transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
              <FaCalendarCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Active Attendance Session</h2>
              <p className="text-sm text-gray-600">Mark your attendance for ongoing classes</p>
            </div>
          </div>
          
          {timeRemaining && !isSessionExpired && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-100 to-pink-100 border border-red-200 rounded-xl">
                <FaClock className="w-4 h-4 text-red-600" />
                <span className="font-bold text-red-700">
                  {String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {activeSession ? (
          <div className="transform transition-all duration-300 hover:scale-[1.005]">
            <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border ${attendanceMarked ? 'border-green-200/60' : 'border-blue-200/60'}`}>
              <div className="p-6 md:p-8">
                {/* Session Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className={`w-16 h-16 ${attendanceMarked ? 'bg-gradient-to-br from-green-100 to-emerald-200' : 'bg-gradient-to-br from-blue-100 to-indigo-200'} rounded-2xl flex items-center justify-center shadow-lg`}>
                        {attendanceMarked ? (
                          <FaCheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                          <FaCalendarCheck className="w-8 h-8 text-blue-600" />
                        )}
                      </div>
                      <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${attendanceMarked ? 'bg-green-500' : 'bg-blue-500'} rounded-full border-4 border-white flex items-center justify-center shadow-lg`}>
                        {attendanceMarked ? (
                          <FaCheckCircle className="w-3 h-3 text-white" />
                        ) : (
                          <FaClock className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{subjectName}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <FaUserTie className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-gray-700">Instructor: {teacherName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <FaClock className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-gray-700">
                            Time: {formatTime(activeSession.startTime)} - {formatTime(activeSession.endTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {attendanceMarked ? (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 text-green-800 font-semibold rounded-2xl">
                          <FaCheckCircle className="w-5 h-5" />
                          <span>Attendance Marked</span>
                        </div>
                      </div>
                    ) : isSessionExpired ? (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 text-gray-700 font-semibold rounded-2xl">
                          <FaTimesCircle className="w-5 h-5" />
                          <span>Session Expired</span>
                        </div>
                      </div>
                    ) : sessionId ? (
                      <Link
                        to={`/student/mark/${sessionId}`}
                        className="group relative overflow-hidden inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <FaCalendarCheck className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Mark Attendance</span>
                        <FaArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-2xl cursor-not-allowed">
                        <FaCalendarCheck />
                        <span>No Session ID</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Session Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="group p-5 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl border border-blue-200/50 hover:border-blue-300 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                        <FaMapMarkerAlt className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Location Requirements</h4>
                        <p className="text-sm text-gray-600">Proximity to classroom</p>
                      </div>
                    </div>
                    <div className="ml-12">
                      <p className="text-sm text-gray-700">
                        You must be within <span className="font-bold text-blue-700">{activeSession.radiusInMeters || 50} meters</span> radius
                      </p>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full w-3/4"></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0m</span>
                          <span>{activeSession.radiusInMeters || 50}m allowed</span>
                          <span>100m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`group p-5 rounded-xl border ${isSessionExpired ? 'bg-gradient-to-br from-gray-50 to-gray-100/30 border-gray-200/50' : 'bg-gradient-to-br from-green-50 to-emerald-100/30 border-green-200/50'} hover:border-green-300 transition-all duration-200`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2.5 rounded-lg ${isSessionExpired ? 'bg-gradient-to-br from-gray-500 to-gray-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                        <FaClock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Session Status</h4>
                        <p className="text-sm text-gray-600">Time remaining</p>
                      </div>
                    </div>
                    <div className="ml-12">
                      <p className={`text-sm font-bold ${isSessionExpired ? 'text-gray-700' : 'text-green-700'}`}>
                        {isSessionExpired ? 'Session has ended' : `Active for ${timeRemaining.minutes} min ${timeRemaining.seconds} sec`}
                      </p>
                      {!isSessionExpired && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600">Live session in progress</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Instructions */}
                {!attendanceMarked && sessionId && !isSessionExpired && (
                  <div className="mt-8 pt-6 border-t border-gray-200/60">
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200/50">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex-shrink-0">
                        <FaInfoCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-800 mb-3">Important Instructions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-blue-700">Enable location services</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-blue-700">Use logged-in device only</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-blue-700">Be within classroom radius</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-blue-700">
                              Session ID: <code className="text-xs bg-blue-100 px-2 py-1 rounded">{sessionId.substring(0, 8)}...</code>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="transform transition-all duration-300 hover:scale-[1.005]">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-300/50"></div>
                    <FaTimesCircle className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Active Sessions</h3>
                <p className="text-gray-600 mb-6">There are no ongoing attendance sessions for your class schedule.</p>
                <button
                  onClick={fetchActiveSession}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FaSync className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Check Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/student/history"
            className="group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                  <FaHistory className="w-6 h-6 text-blue-600" />
                </div>
                <FaArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance History</h3>
              <p className="text-gray-600 mb-4">View your complete attendance records and analytics</p>
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                <span>View Records</span>
              </div>
            </div>
          </Link>
          
          <Link
            to="/student/profile"
            className="group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                  <FaUser className="w-6 h-6 text-purple-600" />
                </div>
                <FaArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Profile</h3>
              <p className="text-gray-600 mb-4">Manage your personal information and account settings</p>
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                <span>Go to Profile</span>
              </div>
            </div>
          </Link>
          
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                  <FaChartLine className="w-6 h-6 text-green-600" />
                </div>
                <FaArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance</h3>
              <p className="text-gray-600 mb-4">Track your attendance percentage and statistics</p>
              <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                <span>View Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {activeSession && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-6">Session Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm opacity-90 mb-1">Duration</p>
              <p className="text-xl font-bold">90 mins</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm opacity-90 mb-1">Class Type</p>
              <p className="text-xl font-bold">Regular</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm opacity-90 mb-1">Semester</p>
              <p className="text-xl font-bold">{activeSession.classSchedule?.semester || 'N/A'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm opacity-90 mb-1">Section</p>
              <p className="text-xl font-bold">{activeSession.classSchedule?.section || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentHome;