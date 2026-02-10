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
    sameSite: "lax", // required for localhost
    secure: false, // true only in production (HTTPS)
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
    sameSite: "lax",
    secure: false,
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
