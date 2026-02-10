const ClassSchedule = require('../models/ClassSchedule');
const Subject = require('../models/Subject');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

// ➕ CREATE CLASS SCHEDULE (ADMIN)
exports.createClassSchedule = catchAsync(async (req, res) => {
  const {
    subjectId,
    teacherId,
    departmentId,
    semester,
    section,
    days,
    startTime,
    endTime,
  } = req.body;

  // 1️⃣ Validate required fields
  if (
    !subjectId ||
    !teacherId ||
    !departmentId ||
    !semester ||
    !days ||
    !startTime ||
    !endTime
  ) {
    return res.status(400).json({
      success: false,
      message: 'All required fields must be provided',
    });
  }

  // 2️⃣ Validate teacher
  const teacher = await User.findOne({
    _id: teacherId,
    role: 'teacher',
    isActive: true,
  });

  if (!teacher) {
    return res.status(400).json({
      success: false,
      message: 'Invalid teacher',
    });
  }

  // 3️⃣ Validate subject
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subject',
    });
  }

  // 4️⃣ Create schedule
  const schedule = await ClassSchedule.create({
    subject: subjectId,
    teacher: teacherId,
    department: departmentId,
    semester,
    section: section || 'A',
    days,
    startTime,
    endTime,
  });

  res.status(201).json({
    success: true,
    message: 'Class schedule created successfully',
    schedule,
  });
});

// 📄 GET ALL CLASS SCHEDULES (ADMIN/TEACHER)
exports.getAllClassSchedules = catchAsync(async (req, res) => {
  const schedules = await ClassSchedule.find()
    .populate('subject', 'name')
    .populate('teacher', 'name email')
    .populate('department', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    results: schedules.length,
    schedules,
  });
});

// 👨‍🏫 GET MY CLASS SCHEDULES (TEACHER)
exports.getMyClassSchedules = catchAsync(async (req, res) => {
  const teacherId = req.user._id;

  const schedules = await ClassSchedule.find({
    teacher: teacherId,
    isActive: true,
  })
    .populate('subject', 'name code')
    .populate('department', 'name')
    .sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    results: schedules.length,
    schedules,
  });
});

// 🔍 GET SINGLE CLASS SCHEDULE
exports.getClassSchedule = catchAsync(async (req, res) => {
  const schedule = await ClassSchedule.findById(req.params.id)
    .populate('subject', 'name code')
    .populate('teacher', 'name email')
    .populate('department', 'name');

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Class schedule not found',
    });
  }

  res.status(200).json({
    success: true,
    schedule,
  });
});

// ✏️ UPDATE CLASS SCHEDULE (ADMIN)
exports.updateClassSchedule = catchAsync(async (req, res) => {
  const schedule = await ClassSchedule.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate('subject', 'name')
    .populate('teacher', 'name email')
    .populate('department', 'name');

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Class schedule not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Class schedule updated successfully',
    schedule,
  });
});

// 🗑️ DELETE CLASS SCHEDULE (ADMIN)
exports.deleteClassSchedule = catchAsync(async (req, res) => {
  const schedule = await ClassSchedule.findByIdAndDelete(req.params.id);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Class schedule not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Class schedule deleted successfully',
  });
});

// 👨‍🏫 GET SCHEDULES BY TEACHER
exports.getSchedulesByTeacher = catchAsync(async (req, res) => {
  const schedules = await ClassSchedule.find({
    teacher: req.params.teacherId,
    isActive: true,
  })
    .populate('subject', 'name code')
    .populate('department', 'name')
    .sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    results: schedules.length,
    schedules,
  });
});

// 📚 GET SCHEDULES BY SUBJECT
exports.getSchedulesBySubject = catchAsync(async (req, res) => {
  const schedules = await ClassSchedule.find({
    subject: req.params.subjectId,
    isActive: true,
  })
    .populate('teacher', 'name email')
    .populate('department', 'name')
    .sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    results: schedules.length,
    schedules,
  });
});

// 📅 GET TODAY'S SCHEDULES FOR TEACHER
exports.getTodaySchedulesForTeacher = catchAsync(async (req, res) => {
  const teacherId = req.user._id;
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Convert day number to day string
  const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDay = daysMap[dayOfWeek];

  const schedules = await ClassSchedule.find({
    teacher: teacherId,
    isActive: true,
    days: { $regex: todayDay, $options: 'i' } // Case insensitive match
  })
    .populate('subject', 'name code')
    .populate('department', 'name')
    .sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    day: todayDay,
    results: schedules.length,
    schedules,
  });
});

// 📅 GET UPCOMING SCHEDULES FOR STUDENT
exports.getUpcomingSchedulesForStudent = catchAsync(async (req, res) => {
  const student = req.user;
  
  // Get schedules for student's department and semester
  const schedules = await ClassSchedule.find({
    department: student.department,
    semester: student.semester,
    isActive: true,
  })
    .populate('subject', 'name code')
    .populate('teacher', 'name email')
    .populate('department', 'name')
    .sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    results: schedules.length,
    schedules,
  });
});