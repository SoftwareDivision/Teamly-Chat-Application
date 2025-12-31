const User = require('../models/User');
const { generateOTP } = require('../utils/otpGenerator');
const { sendOTPEmail } = require('../utils/emailService');
const otpStore = require('../utils/otpStore');
const jwt = require('jsonwebtoken');

class AuthController {
  static async sendOTP(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Generate OTP
      const otpCode = generateOTP();

      // Store OTP in memory (expires in 5 minutes)
      otpStore.set(email, otpCode);

      // Send OTP via email
      await sendOTPEmail(email, otpCode);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully to your email',
        expiresIn: 5 // 5 minutes
      });

    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  }

  static async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required'
        });
      }

      // Verify OTP from memory
      const isValid = otpStore.verify(email, otp);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Find or create user in database
      const user = await User.findOrCreate(email);

      // Generate JWT tokens
      // Access token: short-lived (1 hour) for API requests
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Refresh token: long-lived (30 days) to get new access tokens
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Check if profile is complete
      const isProfileComplete = !!(user.username && user.phone);

      console.log('📋 User profile check:', {
        username: user.username,
        phone: user.phone,
        isProfileComplete: isProfileComplete
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.username,
          phone: user.phone,
          profilePhoto: user.profile_photo ? `data:image/jpeg;base64,${user.profile_photo}` : null,
          isProfileComplete: isProfileComplete
        }
      });

    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP. Please try again.'
      });
    }
  }
}

module.exports = AuthController;
