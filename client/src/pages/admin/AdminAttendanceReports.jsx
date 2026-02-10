import { useEffect, useState } from "react";
import API from "../../services/api";
import {
  CheckCircle,
  XCircle,
  Download,
  Filter,
  User,
  Percent,
  Calendar,
  Building,
  GraduationCap,
  Hash,
  Users,
  BookOpen,
} from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminAttendanceReports() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState(['A', 'B', 'C', 'D']);
  
  const [filters, setFilters] = useState({
    subjectId: "",
    departmentId: "",
    teacherId: "",
    semester: "",
    section: "",
  });
  
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState("all");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [deptRes, subjRes, teacherRes] = await Promise.all([
        API.get('/departments'),
        API.get('/subjects'),
        API.get('/teachers'),
      ]);

      setDepartments(deptRes.data.departments || []);
      setSubjects(subjRes.data.subjects || []);
      setTeachers(teacherRes.data.teachers || teacherRes.data.users || []);
      
      // Generate semester options (1-8)
      const semesterOptions = Array.from({length: 8}, (_, i) => i + 1);
      setSemesters(semesterOptions);
      
    } catch (error) {
      toast.error('Failed to load initial data');
      console.error(error);
    }
  };

  const fetchReport = async () => {
    if (!filters.subjectId) {
      toast.error('Please select a subject');
      return;
    }
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Add all filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
      
      const url = `/reports/subject/${filters.subjectId}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      
      const res = await API.get(url);
      setReport(res.data.report || []);
      
      if (res.data.report && res.data.report.length === 0) {
        toast.info('No attendance records found for the selected filters');
      } else {
        toast.success(`Report generated: ${res.data.report?.length || 0} students`);
      }
      
    } catch (err) {
      toast.error('Failed to generate report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      subjectId: "",
      departmentId: "",
      teacherId: "",
      semester: "",
      section: "",
    });
    setReport([]);
  };

  const filteredReport = report.filter((r) => {
    if (attendanceFilter === "above75") return r.percentage >= 75;
    if (attendanceFilter === "below75") return r.percentage < 75;
    return true;
  });

  const stats = {
    total: report.length,
    above75: report.filter((r) => r.percentage >= 75).length,
    below75: report.filter((r) => r.percentage < 75).length,
    average:
      report.length > 0
        ? Math.round(
            report.reduce((acc, r) => acc + r.percentage, 0) / report.length,
          )
        : 0,
    totalClasses: report.length > 0 ? report[0]?.total : 0,
  };

  // Get unique values from report for display
  const reportDepartments = [...new Set(report.map(r => r.department))];
  const reportSemesters = [...new Set(report.map(r => r.semester))].filter(s => s);
  const reportSections = [...new Set(report.map(r => r.section))].filter(s => s);

  // Helper functions to get names
  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d._id === deptId);
    return dept ? dept.name : 'Unknown';
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId);
    return subject ? subject.name : 'Unknown';
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Attendance Reports
        </h1>
        <p className="text-gray-600">
          View and analyze student attendance with advanced filters
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Filter Attendance Data
          </h2>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="inline mr-2" size={16} />
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              name="subjectId"
              value={filters.subjectId}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.code && `(${s.code})`}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="inline mr-2" size={16} />
              Department
            </label>
            <select
              name="departmentId"
              value={filters.departmentId}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline mr-2" size={16} />
              Teacher
            </label>
            <select
              name="teacherId"
              value={filters.teacherId}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">All Teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} {teacher.email && `(${teacher.email})`}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <GraduationCap className="inline mr-2" size={16} />
              Semester
            </label>
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline mr-2" size={16} />
              Section
            </label>
            <select
              name="section"
              value={filters.section}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">All Sections</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={!filters.subjectId || loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <Calendar size={18} />
                  Generate Attendance Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {Object.values(filters).some(val => val) && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-3">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {filters.subjectId && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  <BookOpen className="mr-1" size={12} />
                  Subject: {getSubjectName(filters.subjectId)}
                </span>
              )}
              {filters.departmentId && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  <Building className="mr-1" size={12} />
                  Department: {getDepartmentName(filters.departmentId)}
                </span>
              )}
              {filters.teacherId && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                  <User className="mr-1" size={12} />
                  Teacher: {getTeacherName(filters.teacherId)}
                </span>
              )}
              {filters.semester && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                  <GraduationCap className="mr-1" size={12} />
                  Semester: {filters.semester}
                </span>
              )}
              {filters.section && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-800">
                  <Users className="mr-1" size={12} />
                  Section: {filters.section}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {report.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reportDepartments.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {reportDepartments.length} dept(s)
                      </span>
                    )}
                    {reportSemesters.length > 0 && (
                      <span className="text-xs text-gray-500">
                        • {reportSemesters.length} sem(s)
                      </span>
                    )}
                    {reportSections.length > 0 && (
                      <span className="text-xs text-gray-500">
                        • {reportSections.length} sec(s)
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Good Attendance (≥75%)</p>
                  <p className="text-2xl font-bold text-green-600">{stats.above75}</p>
                  {stats.total > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      {Math.round((stats.above75 / stats.total) * 100)}% of students
                    </p>
                  )}
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Poor Attendance (&lt;75%)</p>
                  <p className="text-2xl font-bold text-red-600">{stats.below75}</p>
                  {stats.total > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      {Math.round((stats.below75 / stats.total) * 100)}% of students
                    </p>
                  )}
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <XCircle className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Average Attendance</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.average}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on {stats.totalClasses} classes
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Percent className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Filters */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Student Attendance Details
                </h2>
                <p className="text-sm text-gray-600">
                  Showing {filteredReport.length} of {report.length} students
                  {stats.totalClasses > 0 && ` • ${stats.totalClasses} total classes`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAttendanceFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    attendanceFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Users size={16} />
                  All Students ({report.length})
                </button>
                <button
                  onClick={() => setAttendanceFilter("above75")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    attendanceFilter === "above75"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <CheckCircle size={16} />
                  ≥75% ({stats.above75})
                </button>
                <button
                  onClick={() => setAttendanceFilter("below75")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    attendanceFilter === "below75"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <XCircle size={16} />
                  &lt;75% ({stats.below75})
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester/Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReport.map((r) => (
                    <tr
                      key={r.studentId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{r.name}</div>
                          <div className="text-sm text-gray-500">ID: {r.studentId}</div>
                          {r.email && <div className="text-xs text-gray-400">{r.email}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <Building className="mr-2 text-gray-400" size={16} />
                          {getDepartmentName(r.department) || r.department || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {r.semester && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <GraduationCap className="mr-1" size={12} />
                              Sem {r.semester}
                            </span>
                          )}
                          {r.section && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              <Users className="mr-1" size={12} />
                              Sec {r.section}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <span className="font-semibold">{r.present}</span> /{" "}
                          <span className="text-gray-600">{r.total} classes</span>
                        </div>
                        <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              r.percentage >= 75 ? "bg-green-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(r.percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {r.percentage}% attendance
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span
                            className={`text-lg font-bold ${
                              r.percentage >= 75 ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {r.percentage}%
                          </span>
                          {r.percentage >= 75 ? (
                            <CheckCircle className="ml-2 text-green-500" size={18} />
                          ) : (
                            <XCircle className="ml-2 text-red-500" size={18} />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {r.percentage >= 75 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircle className="mr-1.5" size={14} />
                            Good Attendance
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <XCircle className="mr-1.5" size={14} />
                            Needs Improvement
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredReport.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Filter className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No students match the current filter
                </h3>
                <p className="text-gray-500">
                  Try selecting a different attendance filter
                </p>
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Export Report
                </h3>
                <p className="text-sm text-gray-600">
                  Download attendance data for analysis or record keeping
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const csvContent = [
                      ["Student ID", "Name", "Department", "Semester", "Section", "Present", "Total Classes", "Percentage", "Status"],
                      ...report.map((r) => [
                        r.studentId,
                        r.name,
                        getDepartmentName(r.department) || r.department || "N/A",
                        r.semester || "",
                        r.section || "",
                        r.present,
                        r.total,
                        `${r.percentage}%`,
                        r.percentage >= 75 ? "Good" : "Defaulter",
                      ]),
                    ]
                      .map((row) => row.join(","))
                      .join("\n");

                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `attendance-report-${new Date().toISOString().split("T")[0]}.csv`;
                    a.click();
                    toast.success('Report exported successfully');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Export as CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Calendar size={16} />
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {report.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 mb-6">
            <Calendar className="text-blue-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            No Attendance Report Generated
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Select a subject and apply filters to generate detailed attendance reports.
            You can filter by department, teacher, semester, and section.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {!filters.subjectId && (
              <button
                onClick={() => document.querySelector('select[name="subjectId"]')?.focus()}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                📚 Select a Subject
              </button>
            )}
            {filters.subjectId && (
              <button
                onClick={fetchReport}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition"
              >
                🚀 Generate Report
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAttendanceReports;