const jwt = require("jsonwebtoken");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");

/* =====================================================
   🔐 TOKEN HELPERS
===================================================== */

const generateToken = (id, role, email) => {
  return jwt.sign(
    { id, role, email },
    process.env.JWT_SECRET || "your-jwt-secret-key-here",
    { expiresIn: "7d" },
  );
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role, user.email);

  // ✅ HTTP-ONLY COOKIE (AUTH SOURCE OF TRUTH)
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "none", // required for localhost
    secure: true, // true only in production (HTTPS)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(statusCode).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
        ? { id: user.department._id, name: user.department.name }
        : null,
      semester: user.semester,
      section: user.section,
      studentId: user.studentId,
      collegeName: user.collegeName,
      isSuperAdmin: user.isSuperAdmin,
      deviceId: user.deviceId,
      currentSession: user.currentSession,
    },
  });
};

/* =====================================================
   🛡 ROLE / ACCESS CONTROL
===================================================== */

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please authenticate first",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized`,
      });
    }
    next();
  };
};

/* =====================================================
   🌱 FIRST-TIME SETUP
===================================================== */

exports.checkFirstTimeSetup = catchAsync(async (req, res) => {
  const adminCount = await User.countDocuments({ role: "admin" });

  res.status(200).json({
    success: true,
    isFirstTime: adminCount === 0,
  });
});

exports.setupAdmin = catchAsync(async (req, res) => {
  const { name, email, password, collegeName, collegeAddress } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required",
    });
  }

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    return res.status(400).json({
      success: false,
      message: "System already configured",
    });
  }

  const adminUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: "admin",
    collegeName: collegeName || "Default College",
    collegeAddress: collegeAddress || "Default Address",
    isSuperAdmin: true,
  });

  adminUser.lastLogin = new Date();
  await adminUser.save({ validateBeforeSave: false });

  sendTokenResponse(adminUser, 201, res);
});

/* =====================================================
   🔐 LOGIN
===================================================== */

exports.login = catchAsync(async (req, res) => {
  const { email, password, role, deviceId } = req.body;

  console.log("🔍 LOGIN ATTEMPT:", {
    email,
    role,
    deviceId: deviceId?.substring(0, 20),
  });

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+password +deviceId")
    .populate("department", "name");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (role && user.role !== role) {
    return res.status(403).json({
      success: false,
      message: `Not authorized as ${role}`,
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: "Account is deactivated",
    });
  }

  /* ============================
     📱 STUDENT DEVICE LOCK
  ============================ */
  if (user.role === "student") {
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device verification required",
      });
    }

    const cleanDbId = user.deviceId ? String(user.deviceId).trim() : null;
    const cleanReqId = String(deviceId).trim();

    if (!cleanDbId) {
      user.deviceId = cleanReqId;
    } else if (cleanDbId !== cleanReqId) {
      if (process.env.NODE_ENV === "development") {
        user.deviceId = cleanReqId;
      } else {
        return res.status(403).json({
          success: false,
          message: "Login blocked: device mismatch",
        });
      }
    }
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  console.log("✅ Login successful:", user.email);

  sendTokenResponse(user, 200, res);
});

/* =====================================================
   🔓 LOGOUT
===================================================== */

exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

/* =====================================================
   🔧 ADMIN – RESET DEVICE ID (DEV ONLY)
===================================================== */

exports.resetDeviceId = catchAsync(async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      success: false,
      message: "Not allowed in production",
    });
  }

  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const oldDeviceId = user.deviceId;
  user.deviceId = null;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    oldDeviceId,
    newDeviceId: null,
  });
});

/* =====================================================
   🔐 PROTECT (COOKIE-BASED AUTH)
===================================================== */

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, please login",
    });
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "your-jwt-secret-key-here",
  );

  const user = await User.findById(decoded.id).populate("department", "name");
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User no longer exists",
    });
  }

  req.user = user;
  next();
});

/* =====================================================
   👤 GET CURRENT USER
===================================================== */

exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department
        ? { id: req.user.department._id, name: req.user.department.name }
        : null,
      semester: req.user.semester,
      section: req.user.section,
      studentId: req.user.studentId,
      collegeName: req.user.collegeName,
      isSuperAdmin: req.user.isSuperAdmin,
      currentSession: req.user.currentSession,
    },
  });
});


// Add this to authController.js after existing methods

/* =====================================================
   🔑 ADMIN RESET PASSWORD
===================================================== */
exports.adminResetPassword = catchAsync(async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "User ID and new password are required"
    });
  }

  // Find user (admin can reset any user's password)
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully"
  });
});

/* =====================================================
   🔄 ADMIN RESET STUDENT DEVICE ID
===================================================== */
exports.adminResetDeviceId = catchAsync(async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required"
    });
  }

  const student = await User.findOne({ 
    _id: studentId, 
    role: 'student' 
  });

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student not found"
    });
  }

  // Reset device ID
  student.deviceId = null;
  await student.save();

  res.status(200).json({
    success: true,
    message: "Device ID reset successfully"
  });
});



/* =====================================================
   🔐 ADMIN FORGOT PASSWORD - SECURITY QUESTIONS
===================================================== */

// Get security question for admin
exports.getSecurityQuestion = catchAsync(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const user = await User.findOne({ 
    email: email.toLowerCase(), 
    role: 'admin' 
  }).select('+securityQuestion');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found with this email'
    });
  }

  // Check if account is locked due to too many attempts
  if (user.passwordResetLockUntil && user.passwordResetLockUntil > Date.now()) {
    const minutesRemaining = Math.ceil((user.passwordResetLockUntil - Date.now()) / 60000);
    return res.status(429).json({
      success: false,
      message: `Too many attempts. Please try again in ${minutesRemaining} minutes`,
      locked: true
    });
  }

  // If no security question set, return available questions for setup
  if (!user.securityQuestion) {
    const availableQuestions = [
      'What was your childhood nickname?',
      'What is the name of your first pet?',
      'What was your first car?',
      'What elementary school did you attend?',
      'What is the name of the town where you were born?',
      'What is your mother\'s maiden name?',
      'What is your favorite book?',
      'What is your favorite movie?'
    ];

    return res.status(200).json({
      success: true,
      needsSetup: true,
      message: 'Security question not set. Please set up security question first.',
      availableQuestions
    });
  }

  // Reset attempts counter if lock has expired
  if (user.passwordResetLockUntil && user.passwordResetLockUntil < Date.now()) {
    user.passwordResetAttempts = 0;
    user.passwordResetLockUntil = null;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    success: true,
    needsSetup: false,
    question: user.securityQuestion,
    email: user.email
  });
});

// Set security question and answer for admin
exports.setSecurityQuestion = catchAsync(async (req, res) => {
  const { email, question, answer } = req.body;

  if (!email || !question || !answer) {
    return res.status(400).json({
      success: false,
      message: 'Email, question, and answer are required'
    });
  }

  const user = await User.findOne({ 
    email: email.toLowerCase(), 
    role: 'admin' 
  }).select('+securityQuestion +securityAnswer');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  user.securityQuestion = question;
  user.securityAnswer = answer;
  user.passwordResetAttempts = 0;
  user.passwordResetLockUntil = null;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Security question set successfully'
  });
});

// Verify security answer and reset password
exports.verifySecurityAndResetPassword = catchAsync(async (req, res) => {
  const { email, answer, newPassword } = req.body;

  if (!email || !answer || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, answer, and new password are required'
    });
  }

  const user = await User.findOne({ 
    email: email.toLowerCase(), 
    role: 'admin' 
  }).select('+securityQuestion +securityAnswer +passwordResetAttempts +passwordResetLockUntil');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  // Check if account is locked
  if (user.passwordResetLockUntil && user.passwordResetLockUntil > Date.now()) {
    const minutesRemaining = Math.ceil((user.passwordResetLockUntil - Date.now()) / 60000);
    return res.status(429).json({
      success: false,
      message: `Too many attempts. Please try again in ${minutesRemaining} minutes`,
      locked: true
    });
  }

  // Check if security question is set
  if (!user.securityQuestion || !user.securityAnswer) {
    return res.status(400).json({
      success: false,
      message: 'Security question not set for this account',
      needsSetup: true
    });
  }

  // Verify answer
  const isAnswerCorrect = await user.compareSecurityAnswer(answer);

  if (!isAnswerCorrect) {
    // Increment failed attempts
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts
    if (user.passwordResetAttempts >= 5) {
      user.passwordResetLockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
    }
    
    await user.save({ validateBeforeSave: false });

    const attemptsLeft = 5 - (user.passwordResetAttempts || 0);
    
    return res.status(401).json({
      success: false,
      message: attemptsLeft > 0 
        ? `Incorrect answer. ${attemptsLeft} attempts remaining.` 
        : 'Account locked for 30 minutes due to too many failed attempts',
      attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0,
      locked: attemptsLeft <= 0
    });
  }

  // Reset password
  user.password = newPassword;
  user.passwordResetAttempts = 0;
  user.passwordResetLockUntil = null;
  user.lastPasswordReset = new Date();

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. You can now login with your new password.'
  });
});

// Update security question (authenticated)
exports.updateSecurityQuestion = catchAsync(async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      success: false,
      message: 'Question and answer are required'
    });
  }

  const user = await User.findById(req.user._id).select('+securityQuestion +securityAnswer');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admins can set security questions'
    });
  }

  user.securityQuestion = question;
  user.securityAnswer = answer;
  user.passwordResetAttempts = 0;
  user.passwordResetLockUntil = null;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Security question updated successfully'
  });
});