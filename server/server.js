const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

// ===== IMPORT ROUTES =====
const authRoutes = require('./routes/auth.routes');
const departmentRoutes = require('./routes/department.routes');
const teacherRoutes = require('./routes/teacher.routes');
const studentRoutes = require('./routes/student.routes');
const subjectRoutes = require('./routes/subject.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const classScheduleRoutes = require('./routes/classSchedule.routes');
const attendanceReportRoutes = require('./routes/attendanceReport.routes');

const app = express();

/* =====================================================
   ✅ TRUST PROXY (REQUIRED FOR CLOUDFLARE / HTTPS)
===================================================== */
app.set('trust proxy', 1);

/* =====================================================
   🔐 SECURITY MIDDLEWARE
===================================================== */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin requests
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Cookie parser is kept for any non-auth cookies (optional, can be removed if not used elsewhere)
app.use(cookieParser());

/* =====================================================
   🌍 UPDATED CORS CONFIG - NO CREDENTIALS NEEDED
===================================================== */
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.FRONTEND_URL,   // Vercel URL
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ];

      // Allow all Vercel deployments and Cloudflare tunnels
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('trycloudflare.com') ||
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    // credentials: false, // Not needed for token-based auth (can be omitted or set to false)
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  })
);

/* =====================================================
   📦 BODY PARSER
===================================================== */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* =====================================================
   🗄 DATABASE CONNECTION
===================================================== */
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/college-attendance',
      {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    );

    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

/* =====================================================
   🧪 DEV REQUEST LOGGER (Enhanced to show auth headers)
===================================================== */
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`\n📍 ${req.method} ${req.originalUrl}`);
    if (req.headers.authorization) {
      console.log('🔐 Auth:', req.headers.authorization.substring(0, 30) + '...');
    }
    next();
  });
}

/* =====================================================
   🚀 ROUTES
===================================================== */
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/class-schedules', classScheduleRoutes);
app.use('/api/reports', attendanceReportRoutes);

/* =====================================================
   ❤️ HEALTH CHECK
===================================================== */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'College Attendance System API',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    auth: 'JWT header-based',
    environment: process.env.NODE_ENV || 'development'
  });
});

/* =====================================================
   🧪 TEST ROUTE (Enhanced)
===================================================== */
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working fine',
    authMethod: 'JWT Bearer Token',
    timestamp: new Date().toISOString()
  });
});

/* =====================================================
   🔍 DEBUG AUTH ENDPOINT (Temporary - remove in production)
===================================================== */
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug-auth', (req, res) => {
    const authHeader = req.headers.authorization;
    res.json({
      success: true,
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? authHeader.substring(0, 30) + '...' : null,
      cookies: req.cookies,
      method: req.method,
      url: req.url
    });
  });
}

/* =====================================================
   ❌ 404 HANDLER
===================================================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

/* =====================================================
   🚨 GLOBAL ERROR HANDLER
===================================================== */
app.use((err, req, res, next) => {
  console.error('🚨 ERROR:', err.stack);

  // Handle specific JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
  });
});

/* =====================================================
   🌐 START SERVER
===================================================== */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 Server running on port', PORT);
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔐 Auth Method: JWT Bearer Token (Headers)');
  console.log('🌐 CORS: Configured for Vercel + Localhost + Cloudflare\n');
});

/* =====================================================
   🛑 GRACEFUL SHUTDOWN
===================================================== */
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('🔌 MongoDB connection closed.');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('🔌 MongoDB connection closed.');
      process.exit(0);
    });
  });
});

