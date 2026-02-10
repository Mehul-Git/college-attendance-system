const Attendance = require('../models/Attendance');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const ClassSchedule = require('../models/ClassSchedule');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

/* ============================
   📍 GEO DISTANCE (HAVERSINE)
============================ */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ============================
   🧠 HELPERS (CRITICAL FIX)
============================ */
const normalizeId = (val) => {
  if (!val) return null;
  if (typeof val === 'object' && val._id) return val._id.toString();
  return val.toString();
};

/* ============================
   ▶️ START ATTENDANCE (TEACHER)
============================ */
exports.startAttendance = catchAsync(async (req, res) => {
  const teacherId = req.user._id;
  const { classScheduleId, latitude, longitude } = req.body;

  if (!classScheduleId || latitude == null || longitude == null) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: classScheduleId, latitude, longitude',
    });
  }

  const schedule = await ClassSchedule.findById(classScheduleId).populate(
    'subject department'
  );

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Class schedule not found',
    });
  }

  if (schedule.teacher.toString() !== teacherId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this class',
    });
  }

  const today = new Date().toLocaleString('en-US', { weekday: 'short' });
  if (!schedule.days.includes(today)) {
    return res.status(403).json({
      success: false,
      message: 'No class scheduled for today',
    });
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = schedule.startTime.split(':').map(Number);
  const [eh, em] = schedule.endTime.split(':').map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return res.status(403).json({
      success: false,
      message: 'Attendance can only be started during class time',
    });
  }

  await AttendanceSession.updateMany(
    { classSchedule: classScheduleId, isActive: true },
    { isActive: false, isLocked: true }
  );

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 5 * 60 * 1000);

  const session = await AttendanceSession.create({
    classSchedule: classScheduleId,
    location: {
      latitude: Number(latitude),
      longitude: Number(longitude),
    },
    radiusInMeters: 30,
    startTime,
    endTime,
    isActive: true,
    isLocked: false,
  });

  res.status(201).json({
    success: true,
    message: 'Attendance session started',
    session,
  });
});

/* ============================
   🧾 MARK ATTENDANCE (STUDENT)
============================ */
exports.markAttendance = catchAsync(async (req, res) => {
  const student = req.user;
  const { sessionId, latitude, longitude, deviceId } = req.body;

  console.log('📝 Mark Attendance:', {
    studentId: student._id,
    sessionId,
  });

  if (!sessionId || latitude == null || longitude == null || !deviceId) {
    return res.status(400).json({
      success: false,
      message:
        'Missing required fields: sessionId, latitude, longitude, deviceId',
    });
  }

  const session = await AttendanceSession.findById(sessionId).populate({
    path: 'classSchedule',
    populate: [
      { path: 'subject', select: 'name code' },
      { path: 'department', select: 'name _id' },
    ],
  });

  if (!session || !session.isActive || session.isLocked) {
    return res.status(400).json({
      success: false,
      message: 'Attendance is closed',
    });
  }

  const now = new Date();
  if (now < session.startTime || now > session.endTime) {
    return res.status(403).json({
      success: false,
      message: 'Attendance window expired',
    });
  }

  /* 🎓 ELIGIBILITY */
  const studentDeptId = normalizeId(student.department);
  const sessionDeptId = normalizeId(session.classSchedule.department);

  if (studentDeptId !== sessionDeptId) {
    console.log('❌ Department mismatch');
    return res.status(403).json({
      success: false,
      message: 'You are not enrolled in this department',
    });
  }

  if (
    student.semester != null &&
    session.classSchedule.semester !== student.semester
  ) {
    console.log('❌ Semester mismatch');
    return res.status(403).json({
      success: false,
      message: 'You are not enrolled in this semester',
    });
  }

  if (
    student.section &&
    session.classSchedule.section &&
    student.section !== session.classSchedule.section
  ) {
    console.log('❌ Section mismatch');
    return res.status(403).json({
      success: false,
      message: 'You are not enrolled in this section',
    });
  }

  if (student.deviceId !== deviceId) {
    return res.status(403).json({
      success: false,
      message: 'Device mismatch',
    });
  }

  const distance = getDistance(
    Number(latitude),
    Number(longitude),
    session.location.latitude,
    session.location.longitude
  );

  if (distance > session.radiusInMeters) {
    return res.status(403).json({
      success: false,
      message: 'Outside allowed location',
    });
  }

  const alreadyMarked = await Attendance.findOne({
    student: student._id,
    session: session._id,
  });

  if (alreadyMarked) {
    return res.status(400).json({
      success: false,
      message: 'Attendance already marked',
    });
  }

  const attendance = await Attendance.create({
    student: student._id,
    session: session._id,
    location: {
      latitude: Number(latitude),
      longitude: Number(longitude),
    },
  });

  await AttendanceRecord.create({
    session: session._id,
    student: student._id,
    subject: session.classSchedule.subject._id,
    department: session.classSchedule.department._id,
    status: 'present',
    deviceId,
    ipAddress: req.ip,
  });

  student.currentSession = session._id;
  await student.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Attendance marked successfully',
    attendance,
  });
});

/* ============================
   🧑‍🎓 GET ACTIVE SESSION
============================ */
exports.getActiveSessionForStudent = catchAsync(async (req, res) => {
  const student = req.user;
  const now = new Date();

  const sessions = await AttendanceSession.find({
    isActive: true,
    isLocked: false,
    endTime: { $gt: now },
  }).populate({
    path: 'classSchedule',
    populate: [
      { path: 'subject', select: 'name code' },
      { path: 'department', select: 'name _id' },
      { path: 'teacher', select: 'name email' },
    ],
  });

  const studentDeptId = normalizeId(student.department);

  const eligible = sessions.find((s) => {
    const sessionDeptId = normalizeId(s.classSchedule.department);

    if (sessionDeptId !== studentDeptId) return false;
    if (
      student.semester != null &&
      s.classSchedule.semester !== student.semester
    )
      return false;
    if (
      student.section &&
      s.classSchedule.section &&
      s.classSchedule.section !== student.section
    )
      return false;

    return true;
  });

  if (!eligible) {
    return res.status(404).json({
      success: false,
      message: 'No active attendance session found',
    });
  }

  res.json({
    success: true,
    session: {
      id: eligible._id,
      location: eligible.location,
      radiusInMeters: eligible.radiusInMeters,
      startTime: eligible.startTime,
      endTime: eligible.endTime,
      subject: eligible.classSchedule.subject,
      teacher: eligible.classSchedule.teacher,
      department: eligible.classSchedule.department,
    },
  });
});

/* ============================
   🧪 DEBUG
============================ */
exports.testEligibility = catchAsync(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/* ============================
   👨‍🏫 LIVE ATTENDANCE
============================ */
exports.getLiveAttendanceStatus = catchAsync(async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Only teachers can access live attendance',
    });
  }

  const session = await AttendanceSession.findById(req.params.sessionId).populate({
    path: 'classSchedule',
    populate: [
      { path: 'subject', select: 'name code' },
      { path: 'department', select: 'name' },
    ],
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Attendance session not found',
    });
  }

  if (session.classSchedule.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const attendance = await Attendance.find({ session: session._id }).populate(
    'student',
    'name studentId email'
  );

  res.json({
    success: true,
    students: attendance.map((a) => ({
      id: a.student._id,
      name: a.student.name,
      studentId: a.student.studentId,
      email: a.student.email,
      markedAt: a.markedAt,
    })),
  });
});

/* ============================
   👤 SESSION DETAILS (STUDENT)
============================ */
exports.getSessionDetails = catchAsync(async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only students can access session details',
    });
  }

  const session = await AttendanceSession.findById(req.params.sessionId).populate({
    path: 'classSchedule',
    populate: [
      { path: 'subject', select: 'name code' },
      { path: 'department', select: 'name _id' },
      { path: 'teacher', select: 'name email' },
    ],
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found',
    });
  }

  const student = req.user;

  const studentDeptId = normalizeId(student.department);
  const sessionDeptId = normalizeId(session.classSchedule.department);

  if (
    studentDeptId !== sessionDeptId ||
    (student.semester != null &&
      session.classSchedule.semester !== student.semester) ||
    (student.section &&
      session.classSchedule.section &&
      student.section !== session.classSchedule.section)
  ) {
    return res.status(403).json({
      success: false,
      message: 'You are not enrolled in this class',
    });
  }

  const marked = await Attendance.findOne({
    student: student._id,
    session: session._id,
  });

  res.json({
    success: true,
    session: {
      id: session._id,
      location: session.location,
      radiusInMeters: session.radiusInMeters,
      startTime: session.startTime,
      endTime: session.endTime,
      hasMarked: !!marked,
      subject: session.classSchedule.subject,
      teacher: session.classSchedule.teacher,
      department: session.classSchedule.department,
    },
  });
});
