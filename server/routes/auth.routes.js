const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/first-time-check', authController.checkFirstTimeSetup);
router.post('/setup-admin', authController.setupAdmin);
router.post('/login', authController.login);

// Protected routes
router.use(authController.protect);
router.get('/me', authController.getMe);

module.exports = router;