const Attendance = require('../models/Attendance');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const ClassSchedule = require('../models/ClassSchedule');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const moment = require('moment-timezone');

/* ============================
   🌏 IST TIMEZONE HELPERS (Fixed)
============================ */
const IST_TIMEZONE = 'Asia/Kolkata';
const SESSION_DURATION_MINUTES = 5;

// Get current time in IST as moment object
const getISTMoment = () => {
  return moment().tz(IST_TIMEZONE);
};

// Convert Date object to IST moment
const toISTMoment = (date) => {
  return moment(date).tz(IST_TIMEZONE);
};

// Check if current IST time is within session window
const isWithinSessionWindow = (sessionStart, sessionEnd) => {
  const nowIST = getISTMoment();
  const startIST = toISTMoment(sessionStart);
  const endIST = toISTMoment(sessionEnd);
  
  return nowIST.isBetween(startIST, endIST, null, '[]'); // '[]' includes boundaries
};

// Format time for display (e.g., "10:30 AM")
const formatISTTime = (date) => {
  return toISTMoment(date).format('hh:mm A');
};

// Format full date for display (e.g., "15 Jan 2024, 10:30 AM")
const formatISTDateTime = (date) => {
  return toISTMoment(date).format('DD MMM YYYY, hh:mm A');
};

// Get current day in IST (matches schedule.days format - "Mon", "Tue", etc.)
const getCurrentISTDay = () => {
  return getISTMoment().format('ddd');
};

// Debug logger for time-related issues
const logTimeDebug = (context, session) => {
  console.log(`⏰ [${context}] Time check:`, {
    nowIST: getISTMoment().format(),
    nowUTC: new Date().toISOString(),
    timezone: IST_TIMEZONE,
    sessionStartIST: toISTMoment(session.startTime).format(),
    sessionEndIST: toISTMoment(session.endTime).format(),
    sessionStartUTC: session.startTime.toISOString(),
    sessionEndUTC: session.endTime.toISOString(),
    isWithinWindow: isWithinSessionWindow(session.startTime, session.endTime)
  });
};

/* ============================
   📍 GEO DISTANCE (HAVERSINE)
============================ */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
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
   🧠 NORMALIZE OBJECT IDS
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

  // Validation
  if (!classScheduleId || latitude == null || longitude == null) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: classScheduleId, latitude, longitude',
    });
  }

  // Get schedule
  const schedule = await ClassSchedule.findById(classScheduleId).populate(
    'subject department'
  );

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Class schedule not found',
    });
  }

  // Check teacher authorization
  if (schedule.teacher.toString() !== teacherId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this class',
    });
  }

  /* 🌏 DAY CHECK (IST) */
  const today = getCurrentISTDay();
  
  console.log('📅 Day check:', { 
    today, 
    scheduleDays: schedule.days,
    matches: schedule.days.includes(today)
  });

  if (!schedule.days.includes(today)) {
    return res.status(403).json({
      success: false,
      message: `No class scheduled for today. Today is ${today}, schedule shows: ${schedule.days.join(', ')}`,
    });
  }

  /* 🌏 TIME CHECK (IST) */
  const nowIST = getISTMoment();
  const currentMinutes = nowIST.hours() * 60 + nowIST.minutes();

  const [sh, sm] = schedule.startTime.split(':').map(Number);
  const [eh, em] = schedule.endTime.split(':').map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return res.status(403).json({
      success: false,
      message: `Attendance can only be started during class time (${schedule.startTime} - ${schedule.endTime} IST)`,
    });
  }

  // Close any existing active sessions for this class
  await AttendanceSession.updateMany(
    { classSchedule: classScheduleId, isActive: true },
    { isActive: false, isLocked: true }
  );

  // Create new session (5 minutes duration)
  const startTime = new Date(); // UTC
  const endTime = new Date(startTime.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);

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

  // Return with IST formatted times
  const sessionObj = session.toObject();
  sessionObj.startTimeIST = formatISTDateTime(session.startTime);
  sessionObj.endTimeIST = formatISTDateTime(session.endTime);
  sessionObj.timezone = IST_TIMEZONE;

  res.status(201).json({
    success: true,
    message: 'Attendance session started successfully',
    session: sessionObj,
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

  // Validation
  if (!sessionId || latitude == null || longitude == null || !deviceId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: sessionId, latitude, longitude, deviceId',
    });
  }

  // Get session with populated class schedule
  const session = await AttendanceSession.findById(sessionId).populate({
    path: 'classSchedule',
    populate: [
      { path: 'subject', select: 'name code' },
      { path: 'department', select: 'name _id' },
    ],
  });

  // Check if session exists and is active
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Attendance session not found',
    });
  }

  if (!session.isActive || session.isLocked) {
    return res.status(400).json({
      success: false,
      message: 'Attendance session is not active',
    });
  }

  /* 🌏 TIME CHECK (IST) */
  if (!isWithinSessionWindow(session.startTime, session.endTime)) {
    logTimeDebug('MARK_ATTENDANCE_FAILED', session);
    
    return res.status(403).json({
      success: false,
      message: `Attendance window expired. Active window: ${formatISTTime(session.startTime)} - ${formatISTTime(session.endTime)} IST`,
    });
  }

  /* 🎓 ELIGIBILITY CHECKS */
  const studentDeptId = normalizeId(student.department);
  const sessionDeptId = normalizeId(session.classSchedule.department);

  // Department check
  if (studentDeptId !== sessionDeptId) {
    console.log('❌ Department mismatch:', { studentDeptId, sessionDeptId });
    return res.status(403).json({
      success: false,
      message: 'You are not enrolled in this department',
    });
  }

  // Semester check
  if (
    student.semester != null &&
    session.classSchedule.semester !== student.semester
  ) {
    console.log('❌ Semester mismatch:', { studentSemester: student.semester, scheduleSemester: session.classSchedule.semester });
    return res.status(403).json({
      success: false,
      message: 'You are not enrolled in this semester',
    });
  }

  // Section check (if applicable)
  if (
    student.section &&
    session.classSchedule.section &&
    student.section !== session.classSchedule.section
  ) {
    console.log('❌ Section mismatch:', { studentSection: student.section, scheduleSection: session.classSchedule.section });
    return res.status(403).json({
      success: false,
      message: 'You are not enrolled in this section',
    });
  }

  // Device check
  if (student.deviceId !== deviceId) {
    console.log('❌ Device mismatch:', { storedDevice: student.deviceId, providedDevice: deviceId });
    return res.status(403).json({
      success: false,
      message: 'Device mismatch. Please use your registered device.',
    });
  }

  /* 📍 GEOFENCE CHECK */
  const distance = getDistance(
    Number(latitude),
    Number(longitude),
    session.location.latitude,
    session.location.longitude
  );

  if (distance > session.radiusInMeters) {
    return res.status(403).json({
      success: false,
      message: `You are ${Math.round(distance)}m away from class. Must be within ${session.radiusInMeters}m.`,
    });
  }

  // Check for duplicate attendance
  const alreadyMarked = await Attendance.findOne({
    student: student._id,
    session: session._id,
  });

  if (alreadyMarked) {
    return res.status(400).json({
      success: false,
      message: 'Attendance already marked for this session',
    });
  }

  // Create attendance record
  const attendance = await Attendance.create({
    student: student._id,
    session: session._id,
    location: {
      latitude: Number(latitude),
      longitude: Number(longitude),
    },
  });

  // Create detailed attendance record
  await AttendanceRecord.create({
    session: session._id,
    student: student._id,
    subject: session.classSchedule.subject._id,
    department: session.classSchedule.department._id,
    status: 'present',
    deviceId,
    ipAddress: req.ip,
    markedAt: new Date(),
  });

  // Update student's current session
  student.currentSession = session._id;
  await student.save({ validateBeforeSave: false });

  // Log success
  console.log('✅ Attendance marked successfully:', {
    studentId: student._id,
    sessionId: session._id,
    time: formatISTDateTime(new Date()),
    distance: Math.round(distance) + 'm',
  });

  res.json({
    success: true,
    message: 'Attendance marked successfully',
    attendance: {
      ...attendance.toObject(),
      markedAtIST: formatISTDateTime(attendance.markedAt),
    },
  });
});

/* ============================
   🧑‍🎓 GET ACTIVE SESSION (STUDENT)
============================ */
exports.getActiveSessionForStudent = catchAsync(async (req, res) => {
  const student = req.user;
  
  // Use regular Date for MongoDB query (UTC comparison works fine)
  const now = new Date();

  // Find all active sessions
  const sessions = await AttendanceSession.find({
    isActive: true,
    isLocked: false,
    endTime: { $gt: now }, // Only sessions that haven't ended yet
  }).populate({
    path: 'classSchedule',
    populate: [
      { path: 'subject', select: 'name code' },
      { path: 'department', select: 'name _id' },
      { path: 'teacher', select: 'name email' },
    ],
  });

  const studentDeptId = normalizeId(student.department);

  // Find eligible session for this student
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
      message: 'No active attendance session found for your class',
    });
  }

  // Check if session is currently active in IST
  const isActiveNow = isWithinSessionWindow(eligible.startTime, eligible.endTime);
  
  // Calculate remaining seconds if active
  const remainingSeconds = isActiveNow ? 
    Math.max(0, Math.floor((eligible.endTime - now) / 1000)) : 0;

  res.json({
    success: true,
    session: {
      id: eligible._id,
      location: eligible.location,
      radiusInMeters: eligible.radiusInMeters,
      startTime: eligible.startTime,
      endTime: eligible.endTime,
      startTimeIST: formatISTTime(eligible.startTime),
      endTimeIST: formatISTTime(eligible.endTime),
      isActiveNow,
      remainingSeconds,
      timezone: IST_TIMEZONE,
      subject: eligible.classSchedule.subject,
      teacher: eligible.classSchedule.teacher,
      department: eligible.classSchedule.department,
    },
  });
});

/* ============================
   🧪 DEBUG ENDPOINT
============================ */
exports.testEligibility = catchAsync(async (req, res) => {
  const nowIST = getISTMoment();
  const utcNow = moment.utc();
  
  // Check day name format consistency
  const dayFormats = {
    moment_ddd: nowIST.format('ddd'),
    moment_dddd: nowIST.format('dddd'),
    jsDate_short: new Date().toLocaleString('en-US', { weekday: 'short', timeZone: IST_TIMEZONE }),
    jsDate_long: new Date().toLocaleString('en-US', { weekday: 'long', timeZone: IST_TIMEZONE }),
  };

  res.json({
    success: true,
    debug: {
      timezone: IST_TIMEZONE,
      serverTime: {
        utc: utcNow.format(),
        utcISO: new Date().toISOString(),
        ist: nowIST.format(),
        istOffset: nowIST.format('Z'),
        istTime: nowIST.format('hh:mm A'),
        istDate: nowIST.format('DD MMM YYYY'),
        istDay: nowIST.format('dddd'),
        istDayShort: nowIST.format('ddd'),
      },
      dayFormats,
      user: {
        id: req.user._id,
        role: req.user.role,
        department: req.user.department,
        semester: req.user.semester,
        section: req.user.section,
        deviceId: req.user.deviceId,
      },
      recommendation: "Your schedule.days should match the 'ddd' format (Mon, Tue, Wed, Thu, Fri, Sat, Sun)",
    }
  });
});

/* ============================
   👨‍🏫 LIVE ATTENDANCE (TEACHER)
============================ */
exports.getLiveAttendanceStatus = catchAsync(async (req, res) => {
  // Check teacher role
  if (req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Only teachers can access live attendance',
    });
  }

  // Get session
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

  // Check authorization
  if (session.classSchedule.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to view this session',
    });
  }

  // Get attendance records
  const attendance = await Attendance.find({ session: session._id }).populate(
    'student',
    'name studentId email'
  );

  // Check if session is active in IST
  const isActiveNow = isWithinSessionWindow(session.startTime, session.endTime);

  // Prepare session info with IST times
  const sessionInfo = {
    id: session._id,
    startTime: session.startTime,
    endTime: session.endTime,
    startTimeIST: formatISTDateTime(session.startTime),
    endTimeIST: formatISTDateTime(session.endTime),
    isActiveNow,
    timezone: IST_TIMEZONE,
    subject: session.classSchedule.subject,
    department: session.classSchedule.department,
    totalStudents: attendance.length,
  };

  res.json({
    success: true,
    session: sessionInfo,
    students: attendance.map((a) => ({
      id: a.student._id,
      name: a.student.name,
      studentId: a.student.studentId,
      email: a.student.email,
      markedAt: a.markedAt,
      markedAtIST: a.markedAt ? formatISTDateTime(a.markedAt) : null,
    })),
  });
});

/* ============================
   👤 SESSION DETAILS (STUDENT)
============================ */
exports.getSessionDetails = catchAsync(async (req, res) => {
  // Check student role
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only students can access session details',
    });
  }

  // Get session
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

  // Check if student is eligible for this session
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

  // Check if student has marked attendance
  const marked = await Attendance.findOne({
    student: student._id,
    session: session._id,
  });

  // Check if session is currently active in IST
  const isActiveNow = isWithinSessionWindow(session.startTime, session.endTime);
  
  // Calculate remaining seconds if active
  const remainingSeconds = isActiveNow ? 
    Math.max(0, Math.floor((session.endTime - new Date()) / 1000)) : 0;

  res.json({
    success: true,
    session: {
      id: session._id,
      location: session.location,
      radiusInMeters: session.radiusInMeters,
      startTime: session.startTime,
      startTimeIST: formatISTTime(session.startTime),
      endTime: session.endTime,
      endTimeIST: formatISTTime(session.endTime),
      isActiveNow,
      remainingSeconds,
      hasMarked: !!marked,
      markedAtIST: marked ? formatISTDateTime(marked.markedAt) : null,
      timezone: IST_TIMEZONE,
      subject: session.classSchedule.subject,
      teacher: session.classSchedule.teacher,
      department: session.classSchedule.department,
    },
  });
});

// Export helpers for potential use in other files
module.exports.helpers = {
  getISTMoment,
  toISTMoment,
  formatISTTime,
  formatISTDateTime,
  isWithinSessionWindow,
  getCurrentISTDay,
  IST_TIMEZONE,
};

/* ============================
   📊 GET COMPLETED SESSIONS FOR TEACHER
============================ */
exports.getCompletedSessions = catchAsync(async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    // Set start and end of the day in IST
    const startOfDay = moment.tz(date, IST_TIMEZONE).startOf('day').toDate();
    const endOfDay = moment.tz(date, IST_TIMEZONE).endOf('day').toDate();
    
    console.log('🔍 Fetching completed sessions:', {
      teacherId,
      date,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    // First get all class schedules for this teacher
    const classSchedules = await ClassSchedule.find({ 
      teacher: teacherId 
    }).select('_id');
    
    const scheduleIds = classSchedules.map(s => s._id);

    // Find all attendance sessions created by this teacher today that are closed/inactive
    const sessions = await AttendanceSession.find({
      classSchedule: { $in: scheduleIds },
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      isActive: false
    }).populate('classSchedule', 'subject department semester section');

    // For each session, check if it has any attendance records
    const completedSessions = [];
    
    for (const session of sessions) {
      const attendanceCount = await Attendance.countDocuments({ 
        session: session._id 
      });
      
      // Only include sessions that actually had attendance marked
      if (attendanceCount > 0) {
        completedSessions.push({
          _id: session._id,
          classScheduleId: session.classSchedule._id,
          subjectName: session.classSchedule.subject?.name || 'Unknown',
          departmentName: session.classSchedule.department?.name || 'Unknown',
          semester: session.classSchedule.semester,
          section: session.classSchedule.section,
          startTime: session.startTime,
          endTime: session.endTime,
          studentCount: attendanceCount,
          createdAt: session.createdAt
        });
      }
    }

    console.log(`✅ Found ${completedSessions.length} completed sessions for teacher`);

    res.json({
      success: true,
      sessions: completedSessions
    });
  } catch (error) {
    console.error('❌ Error fetching completed sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed sessions',
      error: error.message
    });
  }
});

// Also add a simpler version for just checking if a session was completed today
exports.checkTodaySessions = catchAsync(async (req, res) => {
  try {
    const teacherId = req.user._id;
    
    // Get today's date in IST
    const today = moment().tz(IST_TIMEZONE).startOf('day');
    const tomorrow = moment(today).add(1, 'day');

    // Find all class schedules for this teacher
    const classSchedules = await ClassSchedule.find({ 
      teacher: teacherId 
    }).select('_id');
    
    const scheduleIds = classSchedules.map(s => s._id);

    // Find completed sessions for today
    const sessions = await AttendanceSession.find({
      classSchedule: { $in: scheduleIds },
      createdAt: { 
        $gte: today.toDate(), 
        $lt: tomorrow.toDate() 
      },
      isActive: false
    }).select('classSchedule');

    // Create a map of completed schedule IDs
    const completedMap = {};
    sessions.forEach(session => {
      completedMap[session.classSchedule.toString()] = true;
    });

    res.json({
      success: true,
      completed: completedMap
    });
  } catch (error) {
    console.error('❌ Error checking today sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check sessions',
      error: error.message
    });
  }
});

/* ============================
   🔚 CLOSE ATTENDANCE SESSION (TEACHER)
============================ */
exports.closeAttendanceSession = catchAsync(async (req, res) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user._id;

    // Find the session
    const session = await AttendanceSession.findById(sessionId).populate({
      path: 'classSchedule',
      select: 'teacher'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    // Check if teacher owns this session
    if (session.classSchedule.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to close this session'
      });
    }

    // Update session to inactive
    session.isActive = false;
    session.isLocked = true;
    await session.save();

    // Get attendance count for this session
    const attendanceCount = await Attendance.countDocuments({ session: sessionId });

    console.log('✅ Session closed successfully:', {
      sessionId,
      teacherId,
      attendanceCount
    });

    res.json({
      success: true,
      message: 'Attendance session closed successfully',
      data: {
        sessionId,
        attendanceCount,
        closedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error closing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close attendance session',
      error: error.message
    });
  }
});