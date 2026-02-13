import { useEffect, useState } from 'react';
import API from '../../services/api';
import { 
  FaHistory, 
  FaCalendarDay, 
  FaCheckCircle, 
  FaSpinner, 
  FaRedo, 
  FaChevronRight, 
  FaUserTie,
  FaExclamationCircle,
  FaUser,
  FaBookOpen,
  FaClock
} from 'react-icons/fa';

function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setRefreshing(true);
      setError('');
      const res = await API.get('/reports/my-attendance');
      console.log('Attendance API Response:', res.data); // Debug log
      
      if (res.data.success) {
        setRecords(res.data.records || []);
        setTotal(res.data.records?.length || 0);
      } else {
        setError(res.data.message || 'Failed to load records');
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError('Failed to load attendance history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to extract teacher name from various possible formats
  const getTeacherName = (record) => {
    if (!record) return 'Not assigned';
    
    // Check direct teacher field
    if (record.teacher) {
      if (typeof record.teacher === 'object' && record.teacher !== null) {
        return record.teacher.name || record.teacher.fullName || 'Unknown Teacher';
      }
      return record.teacher; // String
    }
    
    // Check teacher from session
    if (record.session?.teacher) {
      if (typeof record.session.teacher === 'object' && record.session.teacher !== null) {
        return record.session.teacher.name || record.session.teacher.fullName || 'Unknown Teacher';
      }
      return record.session.teacher;
    }
    
    // Check teacher from classSchedule
    if (record.classSchedule?.teacher) {
      if (typeof record.classSchedule.teacher === 'object' && record.classSchedule.teacher !== null) {
        return record.classSchedule.teacher.name || record.classSchedule.teacher.fullName || 'Unknown Teacher';
      }
      return record.classSchedule.teacher;
    }
    
    // Check teacher from session in classSchedule
    if (record.classSchedule?.session?.teacher) {
      if (typeof record.classSchedule.session.teacher === 'object' && record.classSchedule.session.teacher !== null) {
        return record.classSchedule.session.teacher.name || record.classSchedule.session.teacher.fullName || 'Unknown Teacher';
      }
      return record.classSchedule.session.teacher;
    }
    
    // Check teacher from schedule
    if (record.schedule?.teacher) {
      if (typeof record.schedule.teacher === 'object' && record.schedule.teacher !== null) {
        return record.schedule.teacher.name || record.schedule.teacher.fullName || 'Unknown Teacher';
      }
      return record.schedule.teacher;
    }
    
    return 'Not assigned';
  };

  // Helper function to get subject name
  const getSubjectName = (record) => {
    if (!record) return 'Unknown Subject';
    
    // Check direct subject field
    if (record.subject) {
      if (typeof record.subject === 'object' && record.subject !== null) {
        return record.subject.name || 'Unknown Subject';
      }
      return record.subject;
    }
    
    // Check from session
    if (record.session?.subject) {
      if (typeof record.session.subject === 'object' && record.session.subject !== null) {
        return record.session.subject.name || 'Unknown Subject';
      }
      return record.session.subject;
    }
    
    // Check from classSchedule
    if (record.classSchedule?.subject) {
      if (typeof record.classSchedule.subject === 'object' && record.classSchedule.subject !== null) {
        return record.classSchedule.subject.name || 'Unknown Subject';
      }
      return record.classSchedule.subject;
    }
    
    return 'Unknown Subject';
  };

  // Helper function to get date
  const getFormattedDate = (record) => {
    if (record.date) return new Date(record.date);
    if (record.markedAt) return new Date(record.markedAt);
    if (record.createdAt) return new Date(record.createdAt);
    if (record.session?.startTime) return new Date(record.session.startTime);
    if (record.classSchedule?.startTime) {
      // If we have startTime but no date, use today
      const today = new Date();
      const [hours, minutes] = record.classSchedule.startTime.split(':');
      today.setHours(parseInt(hours), parseInt(minutes), 0);
      return today;
    }
    return new Date();
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-6">
            <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Attendance History</h3>
          <p className="text-gray-500">Please wait while we fetch your records</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <FaHistory className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance History</h1>
                <p className="text-gray-600 mt-1">Track and monitor all your attendance records</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FaCalendarDay className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-blue-100">Total Records</div>
                    <div className="text-lg font-bold text-white">{total}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50/70 backdrop-blur-sm border border-red-200/60 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
              <FaExclamationCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800">Error Loading Records</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <div className="max-w-md mx-auto mt-16">
          <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/80 rounded-2xl p-12 text-center shadow-lg backdrop-blur-sm">
            <div className="relative mx-auto mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-300/50"></div>
                <FaCalendarDay className="w-12 h-12 text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white">
                <FaHistory className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Attendance Records Found</h3>
            <p className="text-gray-600 mb-8">You haven't marked any attendance yet. Start attending classes to see your records here.</p>
            <button
              onClick={fetchHistory}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {refreshing ? (
                <>
                  <FaSpinner className="animate-spin w-4 h-4" />
                  Checking...
                </>
              ) : (
                <>
                  <FaRedo className="w-4 h-4" />
                  Check Again
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-gray-100/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
                <p className="text-sm text-gray-600 mt-1">All your attendance history in one place</p>
              </div>
              <button
                onClick={fetchHistory}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow"
              >
                {refreshing ? (
                  <FaSpinner className="animate-spin w-4 h-4" />
                ) : (
                  <FaRedo className="w-4 h-4" />
                )}
                Refresh
              </button>
            </div>
          </div>
          
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/60">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/30">
                    <th scope="col" className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaBookOpen className="w-3 h-3 text-gray-600" />
                        <span>Subject</span>
                      </div>
                    </th>
                    <th scope="col" className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaClock className="w-3 h-3 text-gray-600" />
                        <span>Date & Time</span>
                      </div>
                    </th>
                    <th scope="col" className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaUserTie className="w-3 h-3 text-gray-600" />
                        <span>Teacher</span>
                      </div>
                    </th>
                    <th scope="col" className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/40">
                  {records.map((record, index) => {
                    const teacherName = getTeacherName(record);
                    const subjectName = getSubjectName(record);
                    const attendanceDate = getFormattedDate(record);
                    
                    return (
                      <tr 
                        key={record._id || index} 
                        className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-blue-100/20 transition-all duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                                <FaBookOpen className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-blue-100 flex items-center justify-center">
                                <span className="text-xs font-semibold text-blue-700">{index + 1}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {subjectName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.subjectCode || record.classSchedule?.subject?.code || 'No code'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div className="text-sm font-medium text-gray-900">
                                {attendanceDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 pl-4">
                              {attendanceDate.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="relative group/status">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur opacity-0 group-hover/status:opacity-20 transition-opacity"></div>
                            <span className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/60">
                              <FaCheckCircle className="h-4 w-4 text-green-500" />
                              Present
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                {teacherName !== 'Not assigned' ? (
                                  <FaUserTie className="h-5 w-5 text-purple-600" />
                                ) : (
                                  <FaUser className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {teacherName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {teacherName === 'Not assigned' ? 'No teacher assigned' : 'Instructor'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end">
                            <button 
                              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => {/* Add view details functionality */}}
                            >
                              <span>View</span>
                              <FaChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50/90 to-gray-100/50 px-8 py-4 border-t border-gray-200/60">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="text-sm text-gray-700">
                  Showing <span className="font-semibold text-gray-900">{records.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{total}</span> records
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Last updated: <span className="font-medium">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceHistory;