const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },

    status: {
      type: String,
      enum: ['present', 'absent'],
      default: 'present',
    },

    // 🔒 Device & session security
    deviceId: {
      type: String,
      required: true,
    },

    ipAddress: String,

    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// 🚨 CRITICAL: One student → one record per session
attendanceRecordSchema.index(
  { session: 1, student: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'AttendanceRecord',
  attendanceRecordSchema
);
