const express = require('express');
const {
  createStudent,
  getStudents,
  deleteStudent,
  updateStudent
} = require('../controllers/studentController');

const { protect, authorize } = require('../controllers/authController');

const router = express.Router();

// Admin protected
router.use(protect, authorize('admin'));

router.route('/')
  .post(createStudent)
  .get(getStudents);

router.route('/:id')
  .delete(deleteStudent)
  .patch(updateStudent);

module.exports = router;