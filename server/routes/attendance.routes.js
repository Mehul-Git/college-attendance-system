const express = require('express');
const { protect, authorize } = require('../controllers/authController');
const {
  startAttendance,
  markAttendance,
  getActiveSessionForStudent,
  getLiveAttendanceStatus,
  getSessionDetails,
  testEligibility,
  getCompletedSessions,
  checkTodaySessions,
  closeAttendanceSession  // Add this import
} = require('../controllers/attendanceController');

const router = express.Router();

/* =====================================================
   🔐 AUTH REQUIRED FOR ALL ATTENDANCE ROUTES
===================================================== */
router.use(protect);

/* =====================================================
   👨‍🏫 TEACHER ROUTES (STRICT)
===================================================== */
// Start a new attendance session
router.post(
  '/start',
  authorize('teacher'),
  startAttendance
);

// Get live attendance status for a session
router.get(
  '/live/:sessionId',
  authorize('teacher'),
  getLiveAttendanceStatus
);

// Close an attendance session
router.post(
  '/close/:sessionId',
  authorize('teacher'),
  closeAttendanceSession
);

// Get completed sessions for teacher (by date)
router.get(
  '/completed-sessions',
  authorize('teacher'),
  getCompletedSessions
);

// Quick check for today's completed sessions
router.get(
  '/check-today',
  authorize('teacher'),
  checkTodaySessions
);

/* =====================================================
   👨‍🎓 STUDENT ROUTES (STRICT)
===================================================== */
// Mark attendance for a session
router.post(
  '/mark',
  authorize('student'),
  markAttendance
);

// Get active session for student
router.get(
  '/active',
  authorize('student'),
  getActiveSessionForStudent
);

// Get session details (if sessionId is known)
router.get(
  '/session/:sessionId',
  authorize('student'),
  getSessionDetails
);

/* =====================================================
   🧪 DEBUG (STUDENT ONLY)
===================================================== */
// Test eligibility endpoint
router.get(
  '/test-eligibility',
  authorize('student'),
  testEligibility
);

module.exports = router;