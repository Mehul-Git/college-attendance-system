const mongoose = require('mongoose');

const classScheduleSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },

    semester: {
      type: Number,
      required: true,
    },

    section: {
      type: String, // A, B, C
      default: 'A',
    },

    // 📅 Days when class happens
    days: {
      type: [String],
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' , 'Sun'],
      required: true,
    },

    // ⏰ Time slot
    startTime: {
      type: String, // "10:00"
      required: true,
    },

    endTime: {
      type: String, // "11:00"
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClassSchedule', classScheduleSchema);
