import { useEffect, useState } from 'react';
import API from '../../services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminClassSchedules() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);

  const [form, setForm] = useState({
    departmentId: '',
    subjectId: '',
    teacherId: '',
    semester: '',
    section: 'A',
    days: [],
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    fetchInitialData();
    fetchSchedules();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [deptRes, subjRes, teacherRes] = await Promise.all([
        API.get('/departments'),
        API.get('/subjects'),
        API.get('/teachers'), // Adjust endpoint if needed
      ]);

      setDepartments(deptRes.data.departments || []);
      setSubjects(subjRes.data.subjects || []);
      setTeachers(teacherRes.data.teachers || teacherRes.data.users || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await API.get('/class-schedules');
      setSchedules(res.data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.departmentId || !form.subjectId || !form.teacherId || 
        !form.semester || form.days.length === 0 || 
        !form.startTime || !form.endTime) {
      toast.error('Please fill all required fields');
      return;
    }

    if (form.startTime >= form.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      await API.post('/class-schedules', form);
      toast.success('Class schedule created successfully!');
      
      // Reset form
      setForm({
        departmentId: '',
        subjectId: '',
        teacherId: '',
        semester: '',
        section: 'A',
        days: [],
        startTime: '',
        endTime: '',
      });
      
      // Refresh schedules list
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create schedule');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getDayBadgeClass = (day) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium ";
    return form.days.includes(day)
      ? baseClass + "bg-blue-500 text-white"
      : baseClass + "bg-gray-200 text-gray-700";
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d._id === deptId);
    return dept ? dept.name : 'Unknown';
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId);
    return subject ? subject.name : 'Unknown';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Class Schedules</h1>
          <p className="text-gray-600 mt-2">Create and manage class schedules for the semester</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Create Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">
            Create New Schedule
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department and Subject Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subjectId"
                  value={form.subjectId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Teacher and Semester Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher <span className="text-red-500">*</span>
                </label>
                <select
                  name="teacherId"
                  value={form.teacherId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} {t.email ? `(${t.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                    placeholder="e.g., 3"
                    min="1"
                    max="8"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={form.section}
                    onChange={handleChange}
                    placeholder="A, B, C..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    maxLength="2"
                  />
                </div>
              </div>
            </div>

            {/* Days Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Class Days <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">
                  {form.days.length} day(s) selected
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' , 'Sunday'].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day.substring(0, 3))}
                    className={`px-4 py-2.5 rounded-lg border transition-all ${form.days.includes(day.substring(0, 3))
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {form.startTime ? formatTime(form.startTime) : 'Not set'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {form.endTime ? formatTime(form.endTime) : 'Not set'}
                </p>
              </div>
            </div>

            {/* Summary Preview */}
            {form.departmentId && form.subjectId && form.teacherId && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-medium text-blue-800 mb-2">Schedule Preview</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <span className="ml-2 font-medium">{getDepartmentName(form.departmentId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Subject:</span>
                    <span className="ml-2 font-medium">{getSubjectName(form.subjectId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Teacher:</span>
                    <span className="ml-2 font-medium">{getTeacherName(form.teacherId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Timing:</span>
                    <span className="ml-2 font-medium">
                      {form.startTime && form.endTime 
                        ? `${formatTime(form.startTime)} - ${formatTime(form.endTime)}`
                        : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
              } text-white`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Schedule...
                </span>
              ) : 'Create Class Schedule'}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Schedules */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Existing Schedules</h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {schedules.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Loading schedules...</p>
              </div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4 text-gray-300">📅</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Schedules Yet</h3>
              <p className="text-gray-500">Create your first class schedule to get started</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {schedules.map((schedule) => (
                <div
                  key={schedule._id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800">
                      {getSubjectName(schedule.subject)}
                    </h3>
                    <span className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
                      Sem {schedule.semester}
                      {schedule.section && ` • Sec ${schedule.section}`}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <span className="mr-2">👨‍🏫</span>
                      <span>{getTeacherName(schedule.teacher)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">🏛️</span>
                      <span>{getDepartmentName(schedule.department)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <span className="mr-2">🕒</span>
                        <span className="font-medium">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {schedule.days?.map((day) => (
                          <span
                            key={day}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar at Bottom */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">{schedules.length}</div>
          <div className="text-sm text-gray-600">Total Schedules</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <div className="text-2xl font-bold text-green-600">{new Set(schedules.map(s => s.department)).size}</div>
          <div className="text-sm text-gray-600">Departments Covered</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <div className="text-2xl font-bold text-purple-600">{new Set(schedules.map(s => s.teacher)).size}</div>
          <div className="text-sm text-gray-600">Teachers Assigned</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <div className="text-2xl font-bold text-orange-600">{new Set(schedules.map(s => s.subject)).size}</div>
          <div className="text-sm text-gray-600">Subjects Scheduled</div>
        </div>
      </div>
    </div>
  );
}

export default AdminClassSchedules;