const express = require('express');
const {
  createDepartment,
  getDepartments,
  deleteDepartment
} = require('../controllers/departmentController');

const { protect } = require('../controllers/authController');

const router = express.Router();

// Admin only
router.use(protect);

router.route('/')
  .post(createDepartment)
  .get(getDepartments);

router.route('/:id')
  .delete(deleteDepartment);

module.exports = router;
