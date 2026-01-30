const express = require('express');
const {
  createTeacher,
  getTeachers,
  deleteTeacher
} = require('../controllers/teacherController');

const { protect } = require('../controllers/authController');

const router = express.Router();

// Admin only
router.use(protect);

router.route('/')
  .post(createTeacher)
  .get(getTeachers);

router.route('/:id')
  .delete(deleteTeacher);

module.exports = router;
