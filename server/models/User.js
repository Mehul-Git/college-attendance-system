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

    // 🔐 Security Questions for Password Reset
    securityQuestion: {
      type: String,
      enum: [
        'What was your childhood nickname?',
        'What is the name of your first pet?',
        'What was your first car?',
        'What elementary school did you attend?',
        'What is the name of the town where you were born?',
        'What is your mother\'s maiden name?',
        'What is your favorite book?',
        'What is your favorite movie?'
      ],
      select: false,
    },

    securityAnswer: {
      type: String,
      select: false,
    },

    passwordResetAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    passwordResetLockUntil: {
      type: Date,
      select: false,
    },

    lastPasswordReset: {
      type: Date,
      select: false,
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

// Hash security answer if modified
userSchema.pre('save', async function () {
  if (!this.isModified('securityAnswer') || !this.securityAnswer) return;
  
  const salt = await bcrypt.genSalt(10);
  this.securityAnswer = await bcrypt.hash(this.securityAnswer.toString().toLowerCase().trim(), salt);
});

/* ============================
   🔑 PASSWORD COMPARISON
============================ */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Compare security answer
userSchema.methods.compareSecurityAnswer = async function (candidateAnswer) {
  if (!this.securityAnswer) return false;
  return bcrypt.compare(candidateAnswer.toString().toLowerCase().trim(), this.securityAnswer);
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