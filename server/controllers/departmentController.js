const Department = require('../models/Department');

// @desc   Create department
// @route  POST /api/departments
// @access Admin
exports.createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    const exists = await Department.findOne({ name });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Department already exists'
      });
    }

    const department = await Department.create({ name, description });

    res.status(201).json({
      success: true,
      department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
};

// @desc   Get all departments
// @route  GET /api/departments
// @access Admin
exports.getDepartments = async (req, res) => {
  const departments = await Department.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    departments
  });
};

// @desc   Delete department
// @route  DELETE /api/departments/:id
// @access Admin
exports.deleteDepartment = async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  await department.deleteOne();

  res.json({
    success: true,
    message: 'Department deleted'
  });
};
