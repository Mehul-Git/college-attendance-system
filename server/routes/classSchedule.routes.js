const express = require('express');
const classScheduleController = require('../controllers/classSchedule.controller');
const authController = require('../controllers/authController');

const router = express.Router();

// Apply protection to all routes
router.use(authController.protect);

// ===== ADMIN ONLY ROUTES =====
router.post(
  '/',
  authController.restrictTo('admin'),
  classScheduleController.createClassSchedule
);

router.put(
  '/:id',
  authController.restrictTo('admin'),
  classScheduleController.updateClassSchedule
);

router.delete(
  '/:id',
  authController.restrictTo('admin'),
  classScheduleController.deleteClassSchedule
);

// ===== TEACHER ONLY ROUTES =====
router.get(
  '/my',
  authController.restrictTo('teacher'),
  classScheduleController.getMyClassSchedules
);

router.get(
  '/today/teacher',
  authController.restrictTo('teacher'),
  classScheduleController.getTodaySchedulesForTeacher
);

// ===== STUDENT ONLY ROUTES =====
router.get(
  '/upcoming/student',
  authController.restrictTo('student'),
  classScheduleController.getUpcomingSchedulesForStudent
);

// ===== SHARED ROUTES (Admin + Teacher) =====
router.get(
  '/',
  authController.restrictTo('admin', 'teacher'),
  classScheduleController.getAllClassSchedules
);

router.get(
  '/teacher/:teacherId',
  authController.restrictTo('admin', 'teacher'),
  classScheduleController.getSchedulesByTeacher
);

// ===== SHARED ROUTES (All authenticated users) =====
router.get(
  '/:id',
  classScheduleController.getClassSchedule
);

router.get(
  '/subject/:subjectId',
  classScheduleController.getSchedulesBySubject
);

module.exports = router;