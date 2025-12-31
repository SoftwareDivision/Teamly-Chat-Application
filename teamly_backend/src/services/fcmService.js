// Firebase Cloud Messaging Service using Firebase Admin SDK

class FCMService {
  // Send notification to a single device using Firebase Cloud Messaging
  static async sendNotification(deviceToken, title, body, data = {}) {
    try {
      const admin = require('firebase-admin');
      
      const message = {
        token: deviceToken,
        notification: {
          title: title,
          body: body,
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'messages',
            sound: 'default',
            color: '#E91E63',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('✅ FCM notification sent:', response);
      return { success: true, response };
    } catch (error) {
      console.error('❌ FCM notification error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send notification to multiple devices using Firebase Cloud Messaging
  static async sendMulticast(deviceTokens, title, body, data = {}) {
    try {
      if (!deviceTokens || deviceTokens.length === 0) {
        console.log('⚠️ No device tokens provided');
        return { success: false, message: 'No tokens' };
      }

      const admin = require('firebase-admin');
      const FCMToken = require('../models/FCMToken');
      
      let successCount = 0;
      let failureCount = 0;
      const responses = [];
      const invalidTokens = [];

      // Send to each token individually (compatible with all Firebase Admin SDK versions)
      for (let i = 0; i < deviceTokens.length; i++) {
        const token = deviceTokens[i];
        try {
          const message = {
            token: token,
            notification: {
              title: title,
              body: body,
            },
            data: {
              ...data,
              timestamp: Date.now().toString(),
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'messages',
                sound: 'default',
                color: '#E91E63',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          };

          const response = await admin.messaging().send(message);
          successCount++;
          responses.push({ success: true, response });
          console.log(`✅ FCM sent to token ${i + 1}/${deviceTokens.length}`);
        } catch (tokenError) {
          failureCount++;
          responses.push({ success: false, error: tokenError.message, code: tokenError.code });
          
          // Log detailed error information
          console.log(`❌ Failed to send to token ${i + 1}/${deviceTokens.length}`);
          console.log(`   Error code: ${tokenError.code}`);
          console.log(`   Error message: ${tokenError.message}`);
          console.log(`   Token (first 20 chars): ${token.substring(0, 20)}...`);
          
          // Check for common error codes and mark for deletion
          if (tokenError.code === 'messaging/invalid-registration-token' || 
              tokenError.code === 'messaging/registration-token-not-registered') {
            console.log(`   ⚠️ Token is invalid or expired - marking for removal`);
            invalidTokens.push(token);
          } else if (tokenError.code === 'messaging/invalid-argument') {
            console.log(`   ⚠️ Invalid message format or token`);
            invalidTokens.push(token);
          }
        }
      }
      
      // Clean up invalid tokens from database
      if (invalidTokens.length > 0) {
        console.log(`🧹 Cleaning up ${invalidTokens.length} invalid token(s)...`);
        for (const invalidToken of invalidTokens) {
          try {
            await FCMToken.deleteFCMToken(invalidToken);
            console.log(`   ✅ Removed invalid token from database`);
          } catch (deleteError) {
            console.log(`   ⚠️ Failed to remove token:`, deleteError.message);
          }
        }
      }
      
      console.log(`✅ FCM multicast sent: ${successCount}/${deviceTokens.length} successful`);
      
      if (failureCount > 0) {
        console.log(`⚠️ ${failureCount} notifications failed`);
      }

      return { 
        success: true, 
        successCount: successCount,
        failureCount: failureCount,
        responses,
        invalidTokensRemoved: invalidTokens.length
      };
    } catch (error) {
      console.error('❌ FCM multicast error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send notification to specific users
  static async sendToUsers(userIds, title, body, data = {}) {
    try {
      const FCMToken = require('../models/FCMToken');
      const tokens = await FCMToken.getMultipleUsersFCMTokens(userIds);
      
      if (tokens.length === 0) {
        console.log('⚠️ No FCM tokens found for users:', userIds);
        return { success: false, message: 'No tokens found' };
      }

      const deviceTokens = tokens.map(t => t.device_token);
      return await this.sendMulticast(deviceTokens, title, body, data);
    } catch (error) {
      console.error('❌ Send to users error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = FCMService;
