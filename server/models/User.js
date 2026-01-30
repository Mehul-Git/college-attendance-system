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
    lastLogin: Date,
  },
  { timestamps: true }
);

// ✅ SIMPLE & CORRECT password hashing
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// ✅ Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ Update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);
