const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ===== IMPORT ROUTES =====
const authRoutes = require('./routes/auth.routes');
const departmentRoutes = require('./routes/department.routes');
const teacherRoutes = require('./routes/teacher.routes');
const studentRoutes = require('./routes/student.routes');

const app = express();

// ===== GLOBAL MIDDLEWARE =====
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/college-attendance',
      {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      }
    );

    console.log('✅ MongoDB Connected');

    // DEV ONLY: clear admin accounts
    if (process.env.NODE_ENV === 'development') {
      try {
        const User = require('./models/User');
        const result = await User.deleteMany({ role: 'admin' });
        if (result.deletedCount > 0) {
          console.log(`🗑️ Cleared ${result.deletedCount} admin accounts`);
        }
      } catch (err) {
        console.log('⚠️ Admin cleanup skipped:', err.message);
      }
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// ===== DEV REQUEST LOGGER =====
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'College Attendance System API',
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ===== TEST ROUTE =====
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working'
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('🚨 ERROR:', err.message);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('\n🚀 Server running on port', PORT);
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔐 Auth API:', `http://localhost:${PORT}/api/auth`);
  console.log('🏫 Departments API:', `http://localhost:${PORT}/api/departments`);
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGINT', () => {
  console.log('👋 Shutting down server...');
  server.close(() => process.exit(0));
});
