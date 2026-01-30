const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser with increased limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college-attendance', {
      
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected');
    
    // Only clean database in development mode
    if (process.env.NODE_ENV === 'development') {
      try {
        const User = require('./models/User');
        const result = await User.deleteMany({ role: 'admin' });
        if (result.deletedCount > 0) {
          console.log(`🗑️  Cleared ${result.deletedCount} existing admin accounts`);
        }
      } catch (cleanupError) {
        console.log('⚠️  Could not clean admin accounts:', cleanupError.message);
      }
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('⚠️  Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Log requests in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.body && req.body.password) {
      const sanitizedBody = { ...req.body };
      sanitizedBody.password = sanitizedBody.password.substring(0, 10) + '...';
      console.log('Body:', sanitizedBody);
    }
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'College Attendance System API',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working!',
    data: { test: true }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Handle specific errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`\n📋 Frontend: http://localhost:3000`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated');
    process.exit(0);
  });
});