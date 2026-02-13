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
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

app.use(cookieParser());

/* =====================================================
   🌍 CORS CONFIG (Vercel + Localhost)
===================================================== */
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.FRONTEND_URL,   // Vercel URL
        'http://localhost:5173',
      ];

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
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
   🧪 DEV REQUEST LOGGER
===================================================== */
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
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
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

/* =====================================================
   🧪 TEST ROUTE
===================================================== */
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working fine',
  });
});

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

  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
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
      process.exit(0);
    });
  });
});
