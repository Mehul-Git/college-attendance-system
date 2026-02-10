const express = require('express');
const authController = require('../controllers/authController');
const attendanceReportController = require('../controllers/attendanceReportController');

const router = express.Router();

// 🔐 Protect all routes
router.use(authController.protect);

/* ===============================
   🏢 GET DEPARTMENTS
================================ */
router.get(
  '/departments',
  authController.restrictTo('admin', 'teacher'),
  attendanceReportController.getAllDepartments
);

/* ===============================
   📊 SUBJECT REPORT
   Admin / Teacher
================================ */
router.get(
  '/subject/:subjectId',
  authController.restrictTo('admin', 'teacher'),
  attendanceReportController.getSubjectReport
);

/* ===============================
   👨‍🎓 STUDENT REPORT
   Admin / Teacher
================================ */
router.get(
  '/student/:studentId',
  authController.restrictTo('admin', 'teacher'),
  attendanceReportController.getStudentAttendance
);

/* ===============================
   👤 MY ATTENDANCE
   Student only
================================ */
router.get(
  '/my-attendance',
  authController.restrictTo('student'),
  attendanceReportController.getMyAttendance
);

/* ===============================
   📈 OVERALL REPORT
   Admin only
================================ */
router.get(
  '/overall',
  authController.restrictTo('admin'),
  attendanceReportController.getOverallReport
);

/* ===============================
   🎯 DASHBOARD SUMMARY
================================ */
router.get(
  '/summary',
  attendanceReportController.getAttendanceSummary
);

/* ===============================
   🔧 DEBUG ENDPOINT
================================ */
router.get(
  '/debug/:subjectId',
  authController.restrictTo('admin', 'teacher'),
  attendanceReportController.debugAttendanceData
);

module.exports = router;