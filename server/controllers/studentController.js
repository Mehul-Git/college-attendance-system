const User = require('../models/User');
const Department = require('../models/Department');

// Generate simple student ID
const generateStudentId = () => {
  return 'STD' + Date.now().toString().slice(-6);
};

// @desc   Create student
// @route  POST /api/students
// @access Admin
exports.createStudent = async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists'
    });
  }

  const dept = await Department.findById(department);
  if (!dept) {
    return res.status(400).json({
      success: false,
      message: 'Invalid department'
    });
  }

  const student = await User.create({
    name,
    email,
    password,
    role: 'student',
    department,
    studentId: generateStudentId()
  });

  res.status(201).json({
    success: true,
    student
  });
};

// @desc   Get all students
// @route  GET /api/students
// @access Admin
exports.getStudents = async (req, res) => {
  const students = await User.find({ role: 'student' })
    .populate('department', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    students
  });
};

// @desc   Delete student
// @route  DELETE /api/students/:id
// @access Admin
exports.deleteStudent = async (req, res) => {
  const student = await User.findById(req.params.id);

  if (!student || student.role !== 'student') {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  await student.deleteOne();

  res.json({
    success: true,
    message: 'Student deleted'
  });
};
