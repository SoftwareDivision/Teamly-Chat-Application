const FCMToken = require('../models/FCMToken');

class FCMController {
  // Register FCM token for a user
  static async registerFCMToken(req, res) {
    try {
      const userId = req.user.userId;
      const { deviceToken, deviceName, deviceType } = req.body;

      if (!deviceToken) {
        return res.status(400).json({
          success: false,
          message: 'Device token is required',
        });
      }

      console.log(`📱 Registering FCM token for user ${userId}`);

      const token = await FCMToken.saveFCMToken(
        userId, 
        deviceToken, 
        deviceName || 'Unknown Device',
        deviceType || 'android'
      );

      console.log(`✅ FCM token registered: ${token.id}`);

      res.status(200).json({
        success: true,
        message: 'FCM token registered successfully',
        token: {
          id: token.id,
          deviceName: token.device_name,
          deviceType: token.device_type,
        },
      });
    } catch (error) {
      console.error('❌ Register FCM token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register FCM token',
        error: error.message,
      });
    }
  }

  // Unregister FCM token
  static async unregisterFCMToken(req, res) {
    try {
      const { deviceToken } = req.body;

      if (!deviceToken) {
        return res.status(400).json({
          success: false,
          message: 'Device token is required',
        });
      }

      console.log(`📱 Unregistering FCM token`);

      const deleted = await FCMToken.deleteFCMToken(deviceToken);

      if (deleted) {
        console.log(`✅ FCM token unregistered`);
        res.status(200).json({
          success: true,
          message: 'FCM token unregistered successfully',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Token not found',
        });
      }
    } catch (error) {
      console.error('❌ Unregister FCM token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unregister FCM token',
        error: error.message,
      });
    }
  }

  // Get user's FCM tokens (for debugging)
  static async getUserTokens(req, res) {
    try {
      const userId = req.user.userId;

      const tokens = await FCMToken.getUserFCMTokens(userId);

      res.status(200).json({
        success: true,
        count: tokens.length,
        tokens: tokens,
      });
    } catch (error) {
      console.error('❌ Get user tokens error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tokens',
      });
    }
  }
}

module.exports = FCMController;
