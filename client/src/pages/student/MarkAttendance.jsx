import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { getDeviceId } from '../../utils/device';
import { getUserLocation } from '../../utils/geolocation';
import {
  FaClock,
  FaSpinner,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaUserGraduate,
  FaBuilding,
  FaLocationArrow,
  FaWifi,
  FaCalendarAlt
} from 'react-icons/fa';

function MarkAttendance() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [session, setSession] = useState(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const [markResult, setMarkResult] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const deviceId = getDeviceId();

  /* ============================
     📥 FETCH SESSION
  ============================ */
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await API.get(`/attendance/session/${sessionId}`);

        if (!res.data?.success) {
          throw new Error(res.data?.message || 'Session not found');
        }

        const s = res.data.session;
        setSession(s);
        setAlreadyMarked(!!s.alreadyMarked);

        const diff = Math.max(
          0,
          Math.floor((new Date(s.endTime) - new Date()) / 1000)
        );
        setTimeLeft(diff);
      } catch (err) {
        setError(err.message);
        setTimeout(() => navigate('/student/dashboard'), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, navigate]);

  /* ============================
     ⏳ TIMER
  ============================ */
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  /* ============================
     📝 MARK ATTENDANCE
  ============================ */
  const markAttendance = async () => {
    console.log('🟢 BUTTON CLICKED');

    if (marking) return;

    setMarking(true);
    setMarkResult(null);
    setLocationError(null);

    try {
      const loc = await getUserLocation();

      console.log('📡 API CALL → /attendance/mark');

      await API.post('/attendance/mark', {
        sessionId: session.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        deviceId,
      });

      setAlreadyMarked(true);
      setMarkResult({
        success: true,
        message: 'Attendance marked successfully! 🎉',
      });
      
      // Auto navigate after successful marking
      setTimeout(() => navigate('/student/dashboard'), 2000);
    } catch (err) {
      if (err.message === 'Location permission denied' || err.message.includes('location')) {
        setLocationError('Location access is required. Please enable location services.');
      }
      
      setMarkResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to mark attendance',
      });
    } finally {
      setMarking(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <FaSpinner className="animate-spin text-5xl text-blue-600" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Session</h3>
          <p className="text-gray-600">Preparing attendance marking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <FaTimesCircle className="text-4xl text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-3">Session Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <p className="text-sm text-gray-500 mb-6">Redirecting to dashboard...</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
          >
            <FaArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/dashboard')}
          className="group flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 transition-colors"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow transition-shadow">
            <FaArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Session Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/40 mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{session.subject?.name}</h1>
                <div className="flex items-center gap-2 text-blue-100">
                  <FaCalendarAlt className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(session.startTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FaClock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Teacher Info */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50/50 rounded-xl">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                <FaUserGraduate className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Instructor</p>
                <p className="font-semibold text-gray-900">{session.teacher?.name}</p>
              </div>
            </div>

            {/* Department Info */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-50/50 rounded-xl">
              <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                <FaBuilding className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-semibold text-gray-900">{session.department?.name}</p>
              </div>
            </div>

            {/* Location & Time Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg">
                    <FaMapMarkerAlt className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Radius</p>
                    <p className="font-bold text-gray-900">{session.radiusInMeters}m</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Allowed distance from class</p>
              </div>

              <div className={`p-4 rounded-xl border ${timeLeft > 300 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100' : timeLeft > 60 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-100' : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-100'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${timeLeft > 300 ? 'bg-gradient-to-br from-green-500 to-emerald-500' : timeLeft > 60 ? 'bg-gradient-to-br from-yellow-500 to-amber-500' : 'bg-gradient-to-br from-red-500 to-pink-500'}`}>
                    <FaClock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Time Remaining</p>
                    <p className={`font-bold ${timeLeft > 300 ? 'text-gray-900' : timeLeft > 60 ? 'text-amber-700' : 'text-red-600'}`}>
                      {timeLeft > 0 ? formatTime(timeLeft) : 'Expired'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">To mark attendance</p>
              </div>
            </div>

            {/* Device Info */}
            <div className="p-4 bg-gray-50/70 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg">
                    <FaWifi className="w-4 h-4 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Device ID</p>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                      {deviceId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result Messages */}
        {markResult && (
          <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm shadow-lg transform transition-all duration-300 ${markResult.success 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${markResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                {markResult.success ? (
                  <FaCheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <FaTimesCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${markResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {markResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {locationError && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <FaLocationArrow className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-800 mb-1">Location Access Required</p>
                <p className="text-sm text-amber-700">{locationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mark Attendance Button */}
        <button
          onClick={markAttendance}
          disabled={marking || timeLeft === 0 || alreadyMarked}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg relative overflow-hidden group ${
            marking || timeLeft === 0 || alreadyMarked
              ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
          }`}
        >
          {/* Background animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          
          <div className="relative z-10 flex items-center justify-center gap-3">
            {marking ? (
              <>
                <FaSpinner className="animate-spin w-6 h-6" />
                <span>Marking Attendance...</span>
              </>
            ) : alreadyMarked ? (
              <>
                <FaCheckCircle className="w-6 h-6" />
                <span>Attendance Already Marked</span>
              </>
            ) : timeLeft === 0 ? (
              <>
                <FaTimesCircle className="w-6 h-6" />
                <span>Session Expired</span>
              </>
            ) : (
              <>
                <FaLocationArrow className="w-6 h-6" />
                <span>Mark My Attendance</span>
              </>
            )}
          </div>
        </button>

        {/* Info Footer */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-600">
              Your location will be verified within {session.radiusInMeters}m radius
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarkAttendance;