const User = require('../models/User');
const Department = require('../models/Department');

// @desc   Create teacher
// @route  POST /api/teachers
// @access Admin
exports.createTeacher = async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists'
    });
  }

  const deptExists = await Department.findById(department);
  if (!deptExists) {
    return res.status(400).json({
      success: false,
      message: 'Invalid department'
    });
  }

  const teacher = await User.create({
    name,
    email,
    password,
    role: 'teacher',
    department
  });

  res.status(201).json({
    success: true,
    teacher
  });
};

// @desc   Get all teachers
// @route  GET /api/teachers
// @access Admin
exports.getTeachers = async (req, res) => {
  const teachers = await User.find({ role: 'teacher' })
    .populate('department', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    teachers
  });
};

// @desc   Delete teacher
// @route  DELETE /api/teachers/:id
// @access Admin
exports.deleteTeacher = async (req, res) => {
  const teacher = await User.findById(req.params.id);

  if (!teacher || teacher.role !== 'teacher') {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found'
    });
  }

  await teacher.deleteOne();

  res.json({
    success: true,
    message: 'Teacher deleted'
  });
};
