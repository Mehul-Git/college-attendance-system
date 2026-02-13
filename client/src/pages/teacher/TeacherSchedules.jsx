import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import {
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaBuilding,
  FaCalendarDay,
  FaPlayCircle,
  FaSpinner,
  FaBookOpen,
  FaCalendarCheck,
  FaChevronRight,
  FaFilter,
  FaSync,
  FaRegCalendarAlt,
  FaLock
} from 'react-icons/fa';

function TeacherSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'upcoming'
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchedules();
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchSchedules = async () => {
    try {
      setRefreshing(true);
      const res = await API.get('/class-schedules/my');
      setSchedules(res.data.schedules || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const today = new Date().toLocaleString('en-US', { weekday: 'short' });
  
  // Check if session time is over
  const isSessionTimeOver = (schedule) => {
    if (!schedule.days.includes(today)) return false;
    
    try {
      const now = currentTime;
      const [hours, minutes] = schedule.endTime.split(':');
      const endTime = new Date();
      endTime.setHours(parseInt(hours), parseInt(minutes), 0);
      
      return now > endTime;
    } catch {
      return false;
    }
  };

  // Check if session is currently active
  const isSessionActive = (schedule) => {
    if (!schedule.days.includes(today)) return false;
    
    try {
      const now = currentTime;
      const [startHours, startMinutes] = schedule.startTime.split(':');
      const [endHours, endMinutes] = schedule.endTime.split(':');
      
      const startTime = new Date();
      startTime.setHours(parseInt(startHours), parseInt(startMinutes), 0);
      
      const endTime = new Date();
      endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);
      
      return now >= startTime && now <= endTime;
    } catch {
      return false;
    }
  };

  // Filter schedules
  const getFilteredSchedules = () => {
    if (filter === 'all') return schedules;
    
    return schedules.filter(schedule => {
      if (filter === 'today') {
        return schedule.days.includes(today);
      }
      if (filter === 'upcoming') {
        const scheduleDays = schedule.days;
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayIndex = weekDays.indexOf(today);
        
        // Check if any schedule day is today or in the future this week
        return scheduleDays.some(day => {
          const dayIndex = weekDays.indexOf(day);
          return dayIndex >= todayIndex && !isSessionTimeOver(schedule);
        });
      }
      return true;
    });
  };

  const filteredSchedules = getFilteredSchedules();

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getDayStatus = (days) => {
    if (days.includes(today)) return 'today';
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIndex = weekDays.indexOf(today);
    
    for (const day of days) {
      const dayIndex = weekDays.indexOf(day);
      if (dayIndex > todayIndex) return 'upcoming';
    }
    return 'past';
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <FaSpinner className="animate-spin text-3xl text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Schedules</h3>
          <p className="text-gray-600">Fetching your class timetables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <FaCalendarAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Class Schedules</h1>
                <p className="text-gray-600 mt-1">Manage and start attendance for your classes</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Current Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              onClick={fetchSchedules}
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

      {/* Stats & Filters */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 backdrop-blur-sm rounded-2xl border border-blue-200/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <FaBookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{schedules.length}</div>
            <p className="text-sm text-gray-600">Total Classes</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-100/30 backdrop-blur-sm rounded-2xl border border-green-200/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <FaCalendarDay className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {schedules.filter(s => s.days.includes(today)).length}
            </div>
            <p className="text-sm text-gray-600">Today's Classes</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100/30 backdrop-blur-sm rounded-2xl border border-purple-200/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <FaUsers className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {schedules.filter(s => getDayStatus(s.days) === 'upcoming').length}
            </div>
            <p className="text-sm text-gray-600">Upcoming Classes</p>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/30 backdrop-blur-sm rounded-2xl border border-amber-200/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                <FaClock className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {schedules.filter(s => s.days.includes(today) && isSessionActive(s)).length}
            </div>
            <p className="text-sm text-gray-600">Active Now</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Classes
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === 'today'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === 'upcoming'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      {/* Schedules List */}
      <div>
        {filteredSchedules.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-300/50"></div>
                <FaRegCalendarAlt className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {filter === 'all' 
                  ? 'No Class Schedules'
                  : filter === 'today'
                  ? 'No Classes Today'
                  : 'No Upcoming Classes'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? "You haven't been assigned any class schedules yet."
                  : filter === 'today'
                  ? "Take a break! No classes scheduled for today."
                  : "All upcoming classes have been completed for this week."
                }
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
                >
                  View All Schedules
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchedules.map((schedule) => {
              const dayStatus = getDayStatus(schedule.days);
              const isToday = dayStatus === 'today';
              const timeOver = isSessionTimeOver(schedule);
              const activeNow = isSessionActive(schedule);
              
              return (
                <div
                  key={schedule._id}
                  className="group relative overflow-hidden"
                >
                  <div className={`absolute inset-0 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity ${
                    isToday && !timeOver
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : dayStatus === 'upcoming'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      : 'bg-gradient-to-r from-gray-500 to-gray-600'
                  }`}></div>
                  
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden hover:shadow-2xl transition-all duration-300">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200/60 relative">
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        {isToday && !timeOver ? (
                          activeNow ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg animate-pulse">
                              LIVE NOW
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800">
                              {timeOver ? 'TIME OVER' : 'TODAY'}
                            </span>
                          )
                        ) : dayStatus === 'upcoming' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                            UPCOMING
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700">
                            PAST
                          </span>
                        )}
                      </div>
                      
                      {/* Content with left alignment */}
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex-shrink-0">
                          <FaBookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-gray-900 mb-2">{schedule.subject?.name || 'Unnamed Subject'}</h2>
                          
                          {/* Time and Department in a row */}
                          <div className="flex flex-wrap items-center gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaClock className="w-3 h-3" />
                              <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="p-1.5 bg-gray-100 rounded-lg">
                                <FaBuilding className="w-3 h-3 text-gray-600" />
                              </div>
                              <span>{schedule.department?.name || 'No Department'}</span>
                            </div>
                          </div>
                          
                          {/* Days */}
                          <div className="flex flex-wrap gap-1 mt-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                              <span
                                key={day}
                                className={`px-2 py-1 text-xs rounded-md ${
                                  schedule.days.includes(day)
                                    ? day === today
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold'
                                      : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-medium'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100/30">
                      {isToday ? (
                        timeOver ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-600">Session time has ended</span>
                            </div>
                            <button
                              disabled
                              className="px-5 py-2.5 bg-gray-300 text-gray-600 font-medium rounded-xl cursor-not-allowed flex items-center gap-2"
                            >
                              <FaLock className="w-4 h-4" />
                              <span>Session Ended</span>
                            </button>
                          </div>
                        ) : activeNow ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium text-green-700">Session is active now!</span>
                            </div>
                            <button
                              onClick={() => navigate(`/teacher/attendance/${schedule._id}`)}
                              className="group relative overflow-hidden inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                              <FaPlayCircle className="w-4 h-4 relative z-10" />
                              <span className="relative z-10">Start Attendance</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-sm font-medium text-yellow-700">Class is scheduled today</span>
                            </div>
                            <button
                              onClick={() => navigate(`/teacher/attendance/${schedule._id}`)}
                              className="group relative overflow-hidden inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                              <FaPlayCircle className="w-4 h-4 relative z-10" />
                              <span className="relative z-10">Start Attendance</span>
                            </button>
                          </div>
                        )
                      ) : dayStatus === 'upcoming' ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaCalendarCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">Upcoming class</span>
                          </div>
                          <button
                            disabled
                            className="px-5 py-2.5 bg-gray-200 text-gray-500 font-medium rounded-xl cursor-not-allowed"
                          >
                            Not Available Yet
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-600">Completed</span>
                          </div>
                          <button
                            onClick={() => navigate(`/teacher/attendance/${schedule._id}`)}
                            className="group flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                          >
                            <span>View History</span>
                            <FaChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Day Info */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Today is {today}, {currentTime.toLocaleDateString()}</h3>
            <p className="text-blue-100">
              Current Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {schedules.filter(s => s.days.includes(today)).length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaCalendarDay className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {schedules.filter(s => s.days.includes(today)).length}
                    </div>
                    <div className="text-sm text-blue-100">Classes Today</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-500/20 rounded-xl backdrop-blur-sm">
                    <FaPlayCircle className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {schedules.filter(s => s.days.includes(today) && !isSessionTimeOver(s)).length}
                    </div>
                    <div className="text-sm text-blue-100">Available Now</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-lg font-medium">No classes today!</p>
                <p className="text-blue-100 text-sm">Enjoy your day off</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherSchedules;