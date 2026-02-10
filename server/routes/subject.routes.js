const express = require('express');
const {
  createSubject,
  getSubjects,
  deleteSubject
} = require('../controllers/subjectController');

const { protect } = require('../controllers/authController');

const router = express.Router();

// Admin protected
router.use(protect);

router.route('/')
  .post(createSubject)
  .get(getSubjects);

router.route('/:id')
  .delete(deleteSubject);

module.exports = router;
