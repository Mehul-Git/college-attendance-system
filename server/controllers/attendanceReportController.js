const Attendance = require('../models/Attendance');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');

/* =====================================================
   📊 SUBJECT WISE REPORT (ADMIN / TEACHER) - FIXED!
===================================================== */
exports.getSubjectReport = catchAsync(async (req, res) => {
  const { subjectId } = req.params;
  const { departmentId } = req.query;

  console.log('🔍 DEBUG: Generating report for subject:', subjectId);

  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID',
      });
    }

    // Create ObjectId instances
    const subjectObjectId = new mongoose.Types.ObjectId(subjectId);
    const departmentObjectId = departmentId && mongoose.Types.ObjectId.isValid(departmentId) 
      ? new mongoose.Types.ObjectId(departmentId) 
      : null;

    // Get total distinct sessions for this subject
    const sessionQuery = { 
      subject: subjectObjectId,
      status: 'present' // Only count present records
    };
    
    if (departmentObjectId) {
      sessionQuery.department = departmentObjectId;
    }
    
    // Count distinct sessions
    const distinctSessions = await AttendanceRecord.distinct('session', sessionQuery);
    const totalDistinctClasses = distinctSessions.length;

    console.log(`📊 Total distinct classes for subject: ${totalDistinctClasses}`);

    // Get all students (with optional department filter)
    const studentQuery = { 
      role: 'student', 
      isActive: true 
    };
    
    if (departmentObjectId) {
      studentQuery.department = departmentObjectId;
    }
    
    const students = await User.find(studentQuery).select('name studentId department');

    // For each student, count their attendance for this subject
    const report = await Promise.all(
      students.map(async (student) => {
        const presentCount = await AttendanceRecord.countDocuments({
          student: student._id,
          subject: subjectObjectId,
          status: 'present'
        });

        const percentage = totalDistinctClasses === 0 
          ? 0 
          : Math.round((presentCount / totalDistinctClasses) * 100);

        return {
          studentId: student.studentId,
          name: student.name,
          department: student.department,
          present: presentCount,
          total: totalDistinctClasses,
          percentage,
          isDefaulter: percentage < 75,
        };
      })
    );

    // Filter out students with 0 attendance if you want
    const validReport = report.filter(r => r.present > 0 || r.total > 0);

    console.log(`✅ Report generated: ${validReport.length} students`);

    res.json({
      success: true,
      totalClasses: totalDistinctClasses,
      report: validReport,
    });
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating attendance report',
      error: error.message
    });
  }
});

/* =====================================================
   👨‍🎓 STUDENT ATTENDANCE (ADMIN / TEACHER VIEW)
===================================================== */
exports.getStudentAttendance = catchAsync(async (req, res) => {
  const { studentId } = req.params;

  const student = await User.findOne({
    studentId,
    role: 'student',
    isActive: true,
  });

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  // Use AttendanceRecord instead of Attendance for better data
  const attendanceRecords = await AttendanceRecord.find({ 
    student: student._id 
  }).populate({
    path: 'subject',
    select: 'name code'
  }).sort({ createdAt: -1 });

  const subjectMap = {};

  attendanceRecords.forEach(record => {
    if (!record.subject) return;

    if (!subjectMap[record.subject._id]) {
      subjectMap[record.subject._id] = {
        subjectId: record.subject._id,
        subjectName: record.subject.name,
        subjectCode: record.subject.code,
        total: 0,
        present: 0,
      };
    }

    subjectMap[record.subject._id].total += 1;
    if (record.status === 'present') {
      subjectMap[record.subject._id].present += 1;
    }
  });

  const overallAttendance = Object.values(subjectMap).map(s => {
    const percentage =
      s.total === 0 ? 0 : Math.round((s.present / s.total) * 100);

    return {
      ...s,
      percentage,
      isDefaulter: percentage < 75,
    };
  });

  res.json({
    success: true,
    student: {
      id: student._id,
      name: student.name,
      studentId: student.studentId,
      department: student.department,
      semester: student.semester,
    },
    overallAttendance,
  });
});

/* =====================================================
   👤 GET MY ATTENDANCE (STUDENT HISTORY)
   🔥 THIS POWERS AttendanceHistory.jsx
===================================================== */
exports.getMyAttendance = catchAsync(async (req, res) => {
  const studentId = req.user._id;

  // Use AttendanceRecord for better data
  const records = await AttendanceRecord.find({ 
    student: studentId 
  })
    .populate('subject', 'name code')
    .populate('session')
    .sort({ createdAt: -1 });

  const formattedRecords = records.map(record => ({
    _id: record._id,
    subject: record.subject?.name || 'Unknown',
    subjectCode: record.subject?.code || '',
    status: record.status,
    date: record.createdAt,
  }));

  res.json({
    success: true,
    records: formattedRecords,
  });
});

/* =====================================================
   📈 OVERALL ATTENDANCE REPORT (ADMIN)
===================================================== */
exports.getOverallReport = catchAsync(async (req, res) => {
  const { departmentId, semester } = req.query;

  const query = { role: 'student', isActive: true };
  if (departmentId) query.department = departmentId;
  if (semester) query.semester = semester;

  const students = await User.find(query);

  const report = await Promise.all(
    students.map(async (student) => {
      // Use AttendanceRecord for better accuracy
      const attendanceRecords = await AttendanceRecord.find({ 
        student: student._id 
      });

      const total = attendanceRecords.length;
      const present = attendanceRecords.filter(r => r.status === 'present').length;
      const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

      return {
        studentId: student.studentId,
        name: student.name,
        department: student.department,
        semester: student.semester,
        present,
        total,
        percentage,
        isDefaulter: percentage < 75,
        status:
          percentage >= 75
            ? 'Good'
            : percentage >= 60
            ? 'Warning'
            : 'Critical',
      };
    })
  );

  const totalStudents = report.length;
  const defaulters = report.filter(r => r.isDefaulter).length;

  res.json({
    success: true,
    summary: {
      totalStudents,
      defaulters,
      defaulterPercentage:
        totalStudents === 0
          ? 0
          : Math.round((defaulters / totalStudents) * 100),
    },
    report,
  });
});

/* =====================================================
   🎯 DASHBOARD SUMMARY (ADMIN / TEACHER / STUDENT)
===================================================== */
exports.getAttendanceSummary = catchAsync(async (req, res) => {
  const user = req.user;

  if (user.role === 'admin') {
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalSubjects = await Subject.countDocuments();

    res.json({
      success: true,
      role: 'admin',
      summary: {
        totalStudents,
        totalTeachers,
        totalSubjects,
      },
    });
  }

  if (user.role === 'teacher') {
    const totalSessions = await AttendanceSession.countDocuments({
      classSchedule: { $exists: true },
    });

    res.json({
      success: true,
      role: 'teacher',
      summary: {
        totalSessions,
      },
    });
  }

  if (user.role === 'student') {
    // Use AttendanceRecord for better accuracy
    const attendanceRecords = await AttendanceRecord.find({ 
      student: user._id 
    });

    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    res.json({
      success: true,
      role: 'student',
      summary: {
        totalAttendance: total,
        presentAttendance: present,
        percentage,
        isDefaulter: percentage < 75,
      },
    });
  }
});

/* =====================================================
   🏢 GET ALL DEPARTMENTS
===================================================== */
exports.getAllDepartments = catchAsync(async (req, res) => {
  try {
    let departments;
    
    // Check if Department model exists
    try {
      // Try to get from Department model
      const DepartmentModel = require('../models/Department');
      departments = await DepartmentModel.find().select('name code _id');
    } catch (err) {
      // If Department model doesn't exist or error, get from User model
      console.log('Department model not found, fetching from User model...');
      
      // Get distinct departments from users
      const departmentIds = await User.distinct('department', {
        role: 'student',
        department: { $ne: null, $ne: '' }
      });
      
      // Get department details from users
      if (departmentIds.length > 0) {
        // Check if departments are ObjectIds or strings
        if (mongoose.Types.ObjectId.isValid(departmentIds[0])) {
          // Departments are ObjectIds (references to User model)
          const users = await User.find({
            _id: { $in: departmentIds }
          }).select('name email department');
          
          departments = users.map(user => ({
            _id: user._id,
            name: user.department || user.name,
            code: user.email || 'N/A'
          }));
        } else {
          // Departments are strings
          departments = departmentIds.map(dept => ({
            _id: new mongoose.Types.ObjectId(), // Generate new ObjectId
            name: dept,
            code: dept.substring(0, 3).toUpperCase()
          }));
        }
      } else {
        departments = [];
      }
    }
    
    res.json({
      success: true,
      departments
    });
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
});

/* =====================================================
   🔧 DEBUG ENDPOINT
===================================================== */
exports.debugAttendanceData = catchAsync(async (req, res) => {
  const { subjectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subject ID',
    });
  }

  const subjectObjectId = new mongoose.Types.ObjectId(subjectId);

  // Check Attendance model
  const attendanceCount = await Attendance.countDocuments();
  
  // Check AttendanceRecord model
  const attendanceRecordCount = await AttendanceRecord.countDocuments({
    subject: subjectObjectId
  });
  
  const distinctSessions = await AttendanceRecord.distinct('session', {
    subject: subjectObjectId
  });
  
  // Sample data
  const sampleRecords = await AttendanceRecord.find({
    subject: subjectObjectId
  })
    .limit(5)
    .populate('student', 'name studentId')
    .populate('subject', 'name code');

  res.json({
    success: true,
    stats: {
      totalAttendanceRecords: attendanceCount,
      totalAttendanceRecordsForSubject: attendanceRecordCount,
      distinctSessionsForSubject: distinctSessions.length,
      expectedClasses: 23 // Your expected number
    },
    sampleRecords: sampleRecords.map(r => ({
      student: r.student?.name,
      studentId: r.student?.studentId,
      session: r.session,
      subject: r.subject?.name,
      status: r.status,
      date: r.createdAt
    }))
  });
});

// Keep this for backward compatibility
exports.getUniqueDepartments = exports.getAllDepartments;