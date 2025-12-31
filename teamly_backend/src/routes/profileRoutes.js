const express = require('express');
const ProfileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All profile routes require authentication
router.put('/update', authenticateToken, ProfileController.updateProfile);
router.get('/me', authenticateToken, ProfileController.getProfile);

module.exports = router;
