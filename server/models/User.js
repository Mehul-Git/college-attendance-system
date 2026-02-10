const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },

    semester: {
      type: Number,
      default: null,
    },

    section: {
      type: String,
      default: 'A',
    },

    studentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    collegeName: {
      type: String,
      default: '',
    },

    collegeAddress: {
      type: String,
      default: '',
    },

    isSuperAdmin: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    currentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      default: null,
    },

    deviceId: {
      type: String,
      default: null,
    },

    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

/* ============================
   🔐 PASSWORD HASHING
============================ */
userSchema.pre('save', async function () {
  // Only hash password if it was modified
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ============================
   🔑 PASSWORD COMPARISON
============================ */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ============================
   🎓 STUDENT DEFAULT SEMESTER
============================ */
userSchema.pre('validate', function () {
  if (this.role === 'student' && !this.semester) {
    this.semester = 1;
  }
});

module.exports = mongoose.model('User', userSchema);
