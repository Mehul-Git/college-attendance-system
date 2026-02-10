const User = require('../models/User');
const Department = require('../models/Department');
const catchAsync = require('../utils/catchAsync');

// Generate simple student ID
const generateStudentId = () => {
  return 'STD' + Date.now().toString().slice(-6);
};

// @desc   Create student
// @route  POST /api/students
// @access Admin
exports.createStudent = catchAsync(async (req, res) => {
  const { name, email, password, department, semester, section } = req.body;

  if (!name || !email || !password || !department || !semester) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required (name, email, password, department, semester)'
    });
  }

  // Validate semester (1-8)
  if (semester < 1 || semester > 8) {
    return res.status(400).json({
      success: false,
      message: 'Semester must be between 1 and 8'
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
    semester: parseInt(semester),
    section: section || 'A',
    studentId: generateStudentId()
  });

  res.status(201).json({
    success: true,
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      role: student.role,
      department: student.department,
      semester: student.semester,
      section: student.section,
      studentId: student.studentId,
      isActive: student.isActive,
      createdAt: student.createdAt
    }
  });
});

// @desc   Get all students
// @route  GET /api/students
// @access Admin
exports.getStudents = catchAsync(async (req, res) => {
  const students = await User.find({ role: 'student' })
    .populate('department', 'name')
    .sort({ createdAt: -1 })
    .select('-password'); // Don't return password

  res.json({
    success: true,
    count: students.length,
    students
  });
});

// @desc   Delete student
// @route  DELETE /api/students/:id
// @access Admin
exports.deleteStudent = catchAsync(async (req, res) => {
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
    message: 'Student deleted successfully'
  });
});

// @desc   Update student semester/section
// @route  PATCH /api/students/:id
// @access Admin
exports.updateStudent = catchAsync(async (req, res) => {
  const { semester, section } = req.body;

  const student = await User.findById(req.params.id);

  if (!student || student.role !== 'student') {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Update fields if provided
  if (semester) {
    if (semester < 1 || semester > 8) {
      return res.status(400).json({
        success: false,
        message: 'Semester must be between 1 and 8'
      });
    }
    student.semester = parseInt(semester);
  }

  if (section) {
    student.section = section;
  }

  await student.save();

  res.json({
    success: true,
    message: 'Student updated successfully',
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      department: student.department,
      semester: student.semester,
      section: student.section,
      studentId: student.studentId
    }
  });
});