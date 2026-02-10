const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/first-time-check', authController.checkFirstTimeSetup);
router.post('/setup-admin', authController.setupAdmin);
router.post('/login', authController.login);

// 🔐 Protected routes (explicit, safe)
router.get('/me', authController.protect, authController.getMe);
router.post('/reset-device', authController.protect, authController.resetDeviceId);

module.exports = router;
