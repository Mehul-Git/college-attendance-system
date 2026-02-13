const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/first-time-check', authController.checkFirstTimeSetup);
router.post('/setup-admin', authController.setupAdmin);
router.post('/login', authController.login);

// 🔐 Admin Forgot Password Routes
router.get('/security-question/:email', authController.getSecurityQuestion);
router.post('/set-security-question', authController.setSecurityQuestion);
router.post('/verify-security-reset', authController.verifySecurityAndResetPassword);

// 🔐 Protected routes
router.get('/me', authController.protect, authController.getMe);
router.post('/logout', authController.protect, authController.logout);
router.post('/reset-device', authController.protect, authController.resetDeviceId);

// 🔐 Update security question (authenticated)
router.post(
  '/update-security-question',
  authController.protect,
  authController.authorize('admin'),
  authController.updateSecurityQuestion
);

// 🔐 Admin-only routes
router.post(
  '/admin/reset-password',
  authController.protect,
  authController.authorize('admin'),
  authController.adminResetPassword
);

router.post(
  '/admin/reset-device-id',
  authController.protect,
  authController.authorize('admin'),
  authController.adminResetDeviceId
);

module.exports = router;