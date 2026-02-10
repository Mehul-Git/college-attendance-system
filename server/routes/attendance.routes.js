const express = require('express');
const { protect, authorize } = require('../controllers/authController');
const {
  startAttendance,
  markAttendance,
  getActiveSessionForStudent,
  getLiveAttendanceStatus,
  getSessionDetails,
  testEligibility,
} = require('../controllers/attendanceController');

const router = express.Router();

/* =====================================================
   🔐 AUTH REQUIRED FOR ALL ATTENDANCE ROUTES
===================================================== */
router.use(protect);

/* =====================================================
   👨‍🏫 TEACHER ROUTES (STRICT)
===================================================== */
router.post(
  '/start',
  authorize('teacher'),
  startAttendance
);

router.get(
  '/live/:sessionId',
  authorize('teacher'),
  getLiveAttendanceStatus
);

/* =====================================================
   👨‍🎓 STUDENT ROUTES (STRICT)
===================================================== */
router.post(
  '/mark',
  authorize('student'),
  markAttendance
);

// ⭐ SINGLE SOURCE FOR STUDENT SESSION
router.get(
  '/active',
  authorize('student'),
  getActiveSessionForStudent
);

// Optional detail view (ONLY if sessionId is known)
router.get(
  '/session/:sessionId',
  authorize('student'),
  getSessionDetails
);

/* =====================================================
   🧪 DEBUG (STUDENT ONLY)
===================================================== */
router.get(
  '/test-eligibility',
  authorize('student'),
  testEligibility
);

module.exports = router;
