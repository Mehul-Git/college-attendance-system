const express = require('express');
const {
  createStudent,
  getStudents,
  deleteStudent
} = require('../controllers/studentController');

const { protect } = require('../controllers/authController');

const router = express.Router();

// Admin protected
router.use(protect);

router.route('/')
  .post(createStudent)
  .get(getStudents);

router.route('/:id')
  .delete(deleteStudent);

module.exports = router;
