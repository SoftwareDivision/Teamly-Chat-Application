const pool = require('../config/database');

class Message {
  // Create a new message
  static async createMessage(chatId, senderId, messageText, messageType = 'text', firebaseUrl = null, firebasePath = null, fileName = null, fileSize = null, documentId = null, replyToId = null) {
    const query = `
      INSERT INTO messages (
        chat_id, sender_id, message_text, message_type, 
        firebase_url, firebase_path, file_name, file_size, document_id, reply_to, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING message_id, chat_id, sender_id, message_text, message_type, 
                firebase_url, file_name, file_size, document_id, reply_to, created_at
    `;
    const result = await pool.query(query, [
      chatId, senderId, messageText, messageType,
      firebaseUrl, firebasePath, fileName, fileSize, documentId, replyToId
    ]);
    return result.rows[0];
  }

  // Get messages for a chat
  static async getChatMessages(chatId, limit = 50, offset = 0) {
    const query = `
      SELECT 
        m.message_id,
        m.chat_id,
        m.sender_id,
        m.message_text,
        m.message_type,
        m.firebase_url,
        m.file_name,
        m.file_size,
        m.reply_to as reply_to_message_id,
        m.created_at,
        u.username as sender_name,
        u.profile_photo as sender_avatar,
        rm.message_text as reply_message_text,
        COALESCE(ru.username, SPLIT_PART(ru.email, '@', 1)) as reply_sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN messages rm ON m.reply_to = rm.message_id
      LEFT JOIN users ru ON rm.sender_id = ru.id
      WHERE m.chat_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [chatId, limit, offset]);
    return result.rows.reverse(); // Return in ascending order
  }

  // Get message by ID
  static async getMessageById(messageId) {
    const query = `
      SELECT 
        m.message_id,
        m.chat_id,
        m.sender_id,
        m.message_text,
        m.message_type,
        m.firebase_url,
        m.file_name,
        m.file_size,
        m.created_at
      FROM messages m
      WHERE m.message_id = $1
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows[0];
  }

  // Delete message
  static async deleteMessage(messageId, senderId) {
    const query = `
      DELETE FROM messages 
      WHERE message_id = $1 AND sender_id = $2
      RETURNING message_id, firebase_path
    `;
    const result = await pool.query(query, [messageId, senderId]);
    return result.rows[0];
  }

  // Update message text (for editing)
  static async updateMessage(messageId, senderId, newText) {
    const query = `
      UPDATE messages
      SET message_text = $1, updated_at = NOW()
      WHERE message_id = $2 AND sender_id = $3
      RETURNING message_id, message_text, updated_at
    `;
    const result = await pool.query(query, [newText, messageId, senderId]);
    return result.rows[0];
  }
}

module.exports = Message;
