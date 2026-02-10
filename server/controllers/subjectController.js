const Subject = require('../models/Subject');
const Department = require('../models/Department');
const User = require('../models/User');

// @desc   Create subject
// @route  POST /api/subjects
// @access Admin
exports.createSubject = async (req, res) => {
  const { name, code, department, teacher } = req.body;

  if (!name || !code || !department || !teacher) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  const deptExists = await Department.findById(department);
  if (!deptExists) {
    return res.status(400).json({
      success: false,
      message: 'Invalid department'
    });
  }

  const teacherExists = await User.findOne({
    _id: teacher,
    role: 'teacher'
  });

  if (!teacherExists) {
    return res.status(400).json({
      success: false,
      message: 'Invalid teacher'
    });
  }

  const subject = await Subject.create({
    name,
    code,
    department,
    teacher
  });

  res.status(201).json({
    success: true,
    subject
  });
};

// @desc   Get all subjects
// @route  GET /api/subjects
// @access Admin
exports.getSubjects = async (req, res) => {
  const subjects = await Subject.find()
    .populate('department', 'name')
    .populate('teacher', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    subjects
  });
};

// @desc   Delete subject
// @route  DELETE /api/subjects/:id
// @access Admin
exports.deleteSubject = async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  await subject.deleteOne();

  res.json({
    success: true,
    message: 'Subject deleted'
  });
};
