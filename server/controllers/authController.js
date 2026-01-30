const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

/* ============================
   TOKEN HELPERS
============================ */

// Generate JWT
const generateToken = (id, role, email) => {
  return jwt.sign(
    { id, role, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Send token + user
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role, user.email);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeName: user.collegeName,
      isSuperAdmin: user.isSuperAdmin
    }
  });
};

/* ============================
   PUBLIC ROUTES
============================ */

// ✅ Check first-time setup
exports.checkFirstTimeSetup = catchAsync(async (req, res) => {
  const adminCount = await User.countDocuments({ role: 'admin' });

  res.status(200).json({
    success: true,
    isFirstTime: adminCount === 0,
    message: adminCount === 0
      ? 'First-time setup required'
      : 'System already configured'
  });
});

// ✅ Setup first admin (NO frontend hashing)
exports.setupAdmin = catchAsync(async (req, res) => {
  const { name, email, password, collegeName, collegeAddress } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }

  // Check if admin already exists
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return res.status(400).json({
      success: false,
      message: 'System already has an administrator. Please login.'
    });
  }

  // Check duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // Create admin
  const adminUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password, // ✅ plain password → bcrypt in model
    role: 'admin',
    collegeName: collegeName || 'Default College',
    collegeAddress: collegeAddress || 'Default Address',
    isSuperAdmin: true
  });

  // Update last login
  await adminUser.updateLastLogin();

  sendTokenResponse(adminUser, 201, res);
});

// ✅ Login
exports.login = catchAsync(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Find user with password
  const user = await User.findOne({
    email: email.toLowerCase()
  }).select('+password');

  // Check credentials
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Role check (optional)
  if (role && user.role !== role) {
    return res.status(401).json({
      success: false,
      message: `This account is not authorized as ${role}`
    });
  }

  // Active check
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Contact administrator.'
    });
  }

  await user.updateLastLogin();

  sendTokenResponse(user, 200, res);
});

/* ============================
   PROTECTED ROUTES
============================ */

// ✅ Protect middleware
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// ✅ Get logged-in user
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeName: user.collegeName,
      isSuperAdmin: user.isSuperAdmin,
      department: user.department
    }
  });
});
