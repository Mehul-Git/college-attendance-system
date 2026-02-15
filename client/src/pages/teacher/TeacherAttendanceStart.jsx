import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import {
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaUserCircle,
  FaSpinner,
  FaPlayCircle,
  FaStopCircle,
  FaMapMarkerAlt,
  FaLocationArrow,
  FaExclamationTriangle,
  FaChevronLeft,
  FaArrowLeft,
  FaListAlt,
  FaUserGraduate,
  FaIdCard,
  FaCalendarAlt,
  FaSignal,
  FaCheckDouble
} from "react-icons/fa";

function TeacherAttendanceStart() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle"); // idle, starting, live
  const [sessionId, setSessionId] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);
  const [attendees, setAttendees] = useState([]);
  const [error, setError] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  /* ============================
     📋 FETCH SCHEDULE INFO
  ============================ */
  useEffect(() => {
    const fetchScheduleInfo = async () => {
      try {
        const res = await API.get(`/class-schedules/${scheduleId}`);
        if (res.data.success) {
          setSessionInfo(res.data.schedule);
          
          // Get total students in this department/semester
          if (res.data.schedule.department?._id) {
            fetchStudentCount(res.data.schedule.department._id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch schedule info:", err);
      }
    };
    
    if (scheduleId) fetchScheduleInfo();
  }, [scheduleId]);

  // Fetch total student count
  const fetchStudentCount = async (departmentId) => {
    try {
      const res = await API.get(`/students/count?department=${departmentId}`);
      setStudentCount(res.data.count || 0);
    } catch (err) {
      console.error("Failed to fetch student count:", err);
    }
  };

  /* ============================
     ▶️ START ATTENDANCE
  ============================ */
  const startAttendance = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setStatus("starting");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;
          
          setLocationData({
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toLocaleTimeString()
          });

          const res = await API.post("/attendance/start", {
            classScheduleId: scheduleId,
            latitude,
            longitude,
            accuracy,
          });

          const id = res.data.session.id || res.data.session._id;
          setSessionId(id);
          setStatus("live");
          setError("");
          setIsSessionExpired(false);
          
          // Initial fetch
          fetchAttendees(id);
        } catch (err) {
          setError(err.response?.data?.message || "Failed to start attendance session");
          setStatus("idle");
        }
      },
      (err) => {
        setError(err.message === "User denied Geolocation" 
          ? "Location permission denied. Please enable location access to start attendance." 
          : "Unable to retrieve your location. Please try again.");
        setStatus("idle");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  /* ============================
     📊 FETCH LIVE ATTENDANCE
  ============================ */
  const fetchAttendees = async (id = sessionId) => {
    if (!id) return;

    try {
      const res = await API.get(`/attendance/live/${id}`);
      setAttendees(res.data.students || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Session expired or role changed. Please re-login.");
        setStatus("idle");
        setSessionId(null);
      }
    }
  };

  /* ============================
     ⏳ TIMER + AUTO REFRESH
  ============================ */
  useEffect(() => {
    if (status !== "live") return;

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    const poll = setInterval(() => fetchAttendees(), 5000);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, [status, sessionId]);

  /* ============================
     ⛔ AUTO END WHEN TIME EXPIRES
  ============================ */
  useEffect(() => {
    if (secondsLeft <= 0 && status === "live") {
      setIsSessionExpired(true);
      endSession();
    }
  }, [secondsLeft, status]);

  const endSession = async () => {
    try {
      await API.post(`/attendance/close/${sessionId}`);
    } catch (err) {
      console.error("Error ending session:", err);
    }
    
    // Don't navigate immediately - show summary
    setStatus("ended");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleManualEnd = () => {
    if (window.confirm("Are you sure you want to end this attendance session?")) {
      endSession();
    }
  };

  const handleBackToDashboard = () => {
    navigate("/teacher");
  };

  // Calculate attendance percentage
  const attendancePercentage = studentCount > 0 
    ? Math.round((attendees.length / studentCount) * 100) 
    : 0;

  /* ============================
     SESSION ENDED VIEW
  ============================ */
  if (status === "ended") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-green-200/60 p-8 text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-green-300/50"></div>
                <FaCheckDouble className="w-12 h-12 text-green-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Attendance Session Ended
            </h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 p-4 rounded-xl border border-blue-200/50">
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">{studentCount || '--'}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 p-4 rounded-xl border border-green-200/50">
                <p className="text-sm text-gray-600 mb-1">Present</p>
                <p className="text-3xl font-bold text-green-600">{attendees.length}</p>
              </div>
            </div>
            
            {/* Attendance Rate */}
            <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50/30 rounded-xl border border-purple-200/50">
              <p className="text-sm text-gray-600 mb-2">Attendance Rate</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Present</span>
                <span className="text-sm font-medium text-gray-900">{attendancePercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${attendancePercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleBackToDashboard}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg"
              >
                Back to Dashboard
              </button>
              {/* Start New Session button removed as requested */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================
     ERROR VIEW
  ============================ */
  if (error && status === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-red-200/60 p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                <FaExclamationTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-red-700 mb-3">Location Error</h3>
            <p className="text-gray-700 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setError("")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToDashboard}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                <FaChevronLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================
     IDLE / START VIEW
  ============================ */
  if (status === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBackToDashboard}
            className="group flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 transition-colors"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow transition-shadow">
              <FaArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Back to Dashboard</span>
          </button>

          {/* Main Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Start Attendance Session</h1>
                  <p className="text-blue-100">Initiate live attendance marking for your class</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FaCalendarAlt className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              {/* Session Info */}
              {sessionInfo && (
                <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-xl border border-blue-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                      <FaListAlt className="w-4 h-4 text-blue-600" />
                    </div>
                    Session Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/70 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FaUserGraduate className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Subject</p>
                          <p className="font-semibold text-gray-900">{sessionInfo.subject?.name || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-white/70 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FaClock className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="font-semibold text-gray-900">5 minutes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {studentCount > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50/30 rounded-xl border border-purple-200/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaUsers className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Total Students in this Department:</span>
                        </div>
                        <span className="text-xl font-bold text-purple-700">{studentCount}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Location Requirements */}
              <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 to-green-50/30 rounded-xl border border-emerald-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg">
                    <FaMapMarkerAlt className="w-4 h-4 text-emerald-600" />
                  </div>
                  Location Requirements
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-700">Your current location will be used as the reference point</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-700">Students must be within 50 meters of your location</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-700">⚠️ Each student can mark attendance ONLY ONCE per session</span>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="text-center">
                <button
                  onClick={startAttendance}
                  className="group relative overflow-hidden inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold rounded-2xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-xl hover:shadow-2xl transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <FaPlayCircle className="w-7 h-7 relative z-10 group-hover:scale-110 transition-transform" />
                  <span className="relative z-10">Start Attendance Session</span>
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  Clicking start will request your location permission
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================
     STARTING VIEW
  ============================ */
  if (status === "starting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mx-auto mb-8">
            <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <FaSpinner className="animate-spin text-5xl text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Starting Session</h3>
          <p className="text-gray-600 mb-6">Initializing attendance session and verifying location...</p>
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <FaLocationArrow className="w-4 h-4" />
            <span className="text-sm">Acquiring GPS coordinates</span>
          </div>
        </div>
      </div>
    );
  }

  /* ============================
     LIVE SESSION VIEW
  ============================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
              <FaUsers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Live Attendance Session</h1>
              <p className="text-gray-600">Real-time student attendance monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className={`relative group ${secondsLeft <= 60 ? 'animate-pulse' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <div className={`relative px-6 py-3 rounded-xl ${
                secondsLeft <= 60 
                  ? 'bg-gradient-to-r from-red-100 to-pink-100 border border-red-200 text-red-700' 
                  : 'bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-blue-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    secondsLeft <= 60 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}>
                    <FaClock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Time Remaining</div>
                    <div className="text-xl font-bold">{formatTime(secondsLeft)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* End Session Button - KEPT AS REQUESTED */}
            <button
              onClick={handleManualEnd}
              disabled={isSessionExpired}
              className="group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <div className={`relative flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium rounded-xl hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200 shadow-lg ${
                isSessionExpired ? 'opacity-50 cursor-not-allowed' : ''
              }`}>
                <FaStopCircle className="w-4 h-4" />
                <span>End Session</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 backdrop-blur-sm rounded-2xl border border-blue-200/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <FaUsers className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-700 px-2 py-1 bg-blue-100 rounded-full">
                Live
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{attendees.length}</div>
            <p className="text-sm text-gray-600">Students Marked</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-100/30 backdrop-blur-sm rounded-2xl border border-green-200/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <FaCheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">Active</div>
            <p className="text-sm text-gray-600">Session Status</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100/30 backdrop-blur-sm rounded-2xl border border-purple-200/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <FaSignal className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">5 min</div>
            <p className="text-sm text-gray-600">Session Duration</p>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/30 backdrop-blur-sm rounded-2xl border border-amber-200/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                <FaMapMarkerAlt className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {locationData?.accuracy ? `${Math.round(locationData.accuracy)}m` : '--'}
            </div>
            <p className="text-sm text-gray-600">GPS Accuracy</p>
          </div>
        </div>

        {/* One Attendance Per Session Warning */}
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50/30 backdrop-blur-sm rounded-xl border border-amber-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg">
              <FaExclamationTriangle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                ⚠️ One Attendance Per Session - Each student can only mark attendance once during this session
              </p>
            </div>
          </div>
        </div>

        {/* Location Info */}
        {locationData && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50/30 backdrop-blur-sm rounded-xl border border-blue-200/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                <FaLocationArrow className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">Session Location Locked</p>
                <p className="text-xs text-blue-600">
                  Latitude: {locationData.latitude.toFixed(6)} • Longitude: {locationData.longitude.toFixed(6)} • 
                  Accuracy: {Math.round(locationData.accuracy)} meters • Time: {locationData.timestamp}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/60">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Live Attendance List</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Total: <span className="font-bold text-gray-900">{attendees.length}</span> / {studentCount || '?'}
                </span>
                <button
                  onClick={() => fetchAttendees()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FaSpinner className="w-4 h-4" />
                  Refresh Now
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {attendees.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Marked Yet</h3>
                <p className="text-gray-600">Waiting for students to mark their attendance...</p>
                <p className="text-sm text-amber-600 mt-4">
                  ⚠️ Remember: Each student can only mark attendance ONCE
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200/60">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/30">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Marked Time
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/40 bg-white">
                  {attendees.map((student, index) => (
                    <tr 
                      key={student.id} 
                      className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-blue-100/20 transition-all duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                              <FaUserCircle className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">Semester {student.semester || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded">
                            <FaIdCard className="w-3 h-3 text-gray-600" />
                          </div>
                          <span className="text-sm text-gray-900 font-medium">{student.studentId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {new Date(student.markedAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(student.markedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative group/status">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur opacity-0 group-hover/status:opacity-20 transition-opacity"></div>
                          <span className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200">
                            <FaCheckCircle className="h-3 w-3 text-green-500" />
                            Present
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50/90 to-gray-100/50 px-6 py-4 border-t border-gray-200/60">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-sm text-gray-700">
                  Showing <span className="font-semibold text-gray-900">{attendees.length}</span> students
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Auto-refreshing every 5 seconds
                </span>
                <span className="text-sm font-medium text-amber-600">
                  ⚠️ One attendance per student
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50/30 backdrop-blur-sm rounded-xl border border-blue-200/50">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex-shrink-0">
              <FaExclamationTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Important Notes</h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="font-bold">Attendance Limitation:</span> Each student can mark attendance ONLY ONCE per session
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Attendance session will automatically end when timer reaches 0</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You can manually end the session anytime using the "End Session" button</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Session ID: <code className="text-xs bg-blue-100 px-2 py-1 rounded">{sessionId?.substring(0, 8)}...</code></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherAttendanceStart;