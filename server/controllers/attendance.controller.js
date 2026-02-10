const AttendanceSession = require('../models/AttendanceSession');
const ClassSchedule = require('../models/ClassSchedule');
const catchAsync = require('../utils/catchAsync');

// ⏱ Attendance window (minutes)
const ATTENDANCE_DURATION_MINUTES = 5;

// 👉 START ATTENDANCE (TEACHER ONLY)
exports.startAttendance = catchAsync(async (req, res) => {
  const teacherId = req.user._id;
  const { classScheduleId, latitude, longitude } = req.body;

  // 1️⃣ Validate input
  if (!classScheduleId || latitude == null || longitude == null) {
    return res.status(400).json({
      success: false,
      message: 'classScheduleId and location are required',
    });
  }

  // 2️⃣ Verify class schedule belongs to this teacher
  const schedule = await ClassSchedule.findOne({
    _id: classScheduleId,
    teacher: teacherId,
    isActive: true,
  });

  if (!schedule) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this class schedule',
    });
  }

  // 3️⃣ Enforce DAY check (Mon, Tue, ...)
  const today = new Date().toLocaleString('en-US', { weekday: 'short' });

  if (!schedule.days.includes(today)) {
    return res.status(400).json({
      success: false,
      message: 'No class scheduled for today',
    });
  }

  // 4️⃣ Enforce TIME window check
  const now = new Date();

  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);

  const classStart = new Date(now);
  classStart.setHours(startH, startM, 0, 0);

  const classEnd = new Date(now);
  classEnd.setHours(endH, endM, 0, 0);

  if (now < classStart || now > classEnd) {
    return res.status(400).json({
      success: false,
      message: 'Attendance can only be started during class time',
    });
  }

  // 5️⃣ Close any existing active session for this schedule
  await AttendanceSession.updateMany(
    {
      classSchedule: classScheduleId,
      isActive: true,
    },
    {
      isActive: false,
      isLocked: true,
    }
  );

  // 6️⃣ Create new attendance session
  const startTime = new Date();
  const endTime = new Date(
    startTime.getTime() + ATTENDANCE_DURATION_MINUTES * 60 * 1000
  );

  const session = await AttendanceSession.create({
    classSchedule: classScheduleId,
    location: {
      latitude,
      longitude,
    },
    radiusInMeters: 50,
    startTime,
    endTime,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: 'Attendance started for 5 minutes',
    session,
  });
});
