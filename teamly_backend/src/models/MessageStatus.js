const pool = require('../config/database');

class MessageStatus {
  // Create message status for a user
  static async createStatus(messageId, userId, status = 'sent') {
    const query = `
      INSERT INTO message_status (message_id, user_id, status, status_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (message_id, user_id) 
      DO UPDATE SET status = $3, status_at = NOW()
      RETURNING id, message_id, user_id, status, status_at
    `;
    const result = await pool.query(query, [messageId, userId, status]);
    return result.rows[0];
  }

  // Update message status
  static async updateStatus(messageId, userId, status) {
    const query = `
      UPDATE message_status
      SET status = $1, status_at = NOW()
      WHERE message_id = $2 AND user_id = $3
      RETURNING id, message_id, user_id, status, status_at
    `;
    const result = await pool.query(query, [status, messageId, userId]);
    return result.rows[0];
  }

  // Get message status for a user
  static async getMessageStatus(messageId, userId) {
    const query = `
      SELECT status, status_at
      FROM message_status
      WHERE message_id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [messageId, userId]);
    return result.rows[0];
  }

  // Get all statuses for a message (for group chats)
  static async getAllMessageStatuses(messageId) {
    const query = `
      SELECT 
        ms.user_id,
        ms.status,
        ms.status_at,
        u.username,
        u.profile_photo
      FROM message_status ms
      LEFT JOIN users u ON ms.user_id = u.id
      WHERE ms.message_id = $1
      ORDER BY ms.status_at DESC
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows;
  }

  // Mark all messages in chat as read for a user
  static async markChatAsRead(chatId, userId) {
    const query = `
      UPDATE message_status ms
      SET status = 'read', status_at = NOW()
      FROM messages m
      WHERE ms.message_id = m.message_id
      AND m.chat_id = $1
      AND ms.user_id = $2
      AND ms.status != 'read'
      RETURNING ms.message_id
    `;
    const result = await pool.query(query, [chatId, userId]);
    return result.rows;
  }
}

module.exports = MessageStatus;
