const express = require('express');
const router = express.Router();
const FCMController = require('../controllers/fcmController');
const { authenticateToken } = require('../middleware/auth');

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication
router.use(authenticateToken);

// Register FCM token
router.post('/register', asyncHandler(FCMController.registerFCMToken));

// Unregister FCM token
router.post('/unregister', asyncHandler(FCMController.unregisterFCMToken));

// Get user's FCM tokens (for debugging)
router.get('/tokens', asyncHandler(FCMController.getUserTokens));

module.exports = router;
