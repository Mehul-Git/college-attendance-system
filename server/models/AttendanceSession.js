const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    // 🔗 Link to ClassSchedule (CORE CHANGE)
    classSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSchedule',
      required: true,
    },

    // 📍 Location from where attendance is allowed
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },

    // 📏 Allowed radius in meters (default 50m)
    radiusInMeters: {
      type: Number,
      default: 50,
    },

    // ⏱ Attendance timing
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },

    endTime: {
      type: Date,
      required: true,
    },

    // 🔐 Is attendance currently active
    isActive: {
      type: Boolean,
      default: true,
    },

    // 🛑 Hard lock flag (manual / auto)
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'AttendanceSession',
  attendanceSessionSchema
);
