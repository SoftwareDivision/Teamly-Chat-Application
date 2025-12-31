const pool = require('../config/database');

class FCMToken {
  // Save or update FCM token for a user
  static async saveFCMToken(userId, deviceToken, deviceName = null, deviceType = 'android') {
    const query = `
      INSERT INTO fcm_tokens (user_id, device_token, device_name, device_type, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (device_token) 
      DO UPDATE SET 
        updated_at = NOW(),
        device_name = COALESCE($3, fcm_tokens.device_name),
        device_type = COALESCE($4, fcm_tokens.device_type)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, deviceToken, deviceName, deviceType]);
    return result.rows[0];
  }

  // Get all FCM tokens for a user
  static async getUserFCMTokens(userId) {
    const query = `
      SELECT device_token 
      FROM fcm_tokens
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => row.device_token);
  }

  // Get all FCM tokens for multiple users
  static async getMultipleUsersFCMTokens(userIds) {
    const query = `
      SELECT user_id, device_token 
      FROM fcm_tokens
      WHERE user_id = ANY($1)
      ORDER BY updated_at DESC
    `;
    const result = await pool.query(query, [userIds]);
    return result.rows;
  }

  // Delete a specific FCM token
  static async deleteFCMToken(deviceToken) {
    const query = `
      DELETE FROM fcm_tokens
      WHERE device_token = $1
      RETURNING *
    `;
    const result = await pool.query(query, [deviceToken]);
    return result.rows[0];
  }

  // Delete all FCM tokens for a user
  static async deleteUserFCMTokens(userId) {
    const query = `
      DELETE FROM fcm_tokens
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Check if token exists
  static async tokenExists(deviceToken) {
    const query = `
      SELECT 1 FROM fcm_tokens
      WHERE device_token = $1
    `;
    const result = await pool.query(query, [deviceToken]);
    return result.rows.length > 0;
  }
}

module.exports = FCMToken;
