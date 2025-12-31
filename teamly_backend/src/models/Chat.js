const pool = require('../config/database');

class Chat {
  // Create a new chat
  static async createChat(type, createdBy, title = null, avatar = null) {
    const query = `
      INSERT INTO chats (type, title, avatar, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING chat_id, type, title, avatar, created_by, created_at
    `;
    const result = await pool.query(query, [type, title, avatar, createdBy]);
    return result.rows[0];
  }

  // Get chat by ID
  static async getChatById(chatId) {
    const query = `
      SELECT chat_id, type, title, avatar, created_by, created_at, updated_at
      FROM chats
      WHERE chat_id = $1
    `;
    const result = await pool.query(query, [chatId]);
    return result.rows[0];
  }

  // Get all chats for a user
  static async getUserChats(userId) {
    const query = `
      SELECT 
        c.chat_id,
        c.type,
        c.title,
        c.avatar,
        c.created_at,
        (
          SELECT message_text 
          FROM messages 
          WHERE chat_id = c.chat_id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at 
          FROM messages 
          WHERE chat_id = c.chat_id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) 
          FROM messages m
          LEFT JOIN message_status ms ON m.message_id = ms.message_id AND ms.user_id = $1
          WHERE m.chat_id = c.chat_id 
          AND m.sender_id != $1
          AND (ms.status IS NULL OR ms.status != 'read')
        ) as unread_count,
        (
          SELECT u.username
          FROM chat_members cm2
          INNER JOIN users u ON cm2.user_id = u.id
          WHERE cm2.chat_id = c.chat_id 
          AND cm2.user_id != $1
          LIMIT 1
        ) as other_user_name,
        (
          SELECT u.email
          FROM chat_members cm2
          INNER JOIN users u ON cm2.user_id = u.id
          WHERE cm2.chat_id = c.chat_id 
          AND cm2.user_id != $1
          LIMIT 1
        ) as other_user_email,
        (
          SELECT u.profile_photo
          FROM chat_members cm2
          INNER JOIN users u ON cm2.user_id = u.id
          WHERE cm2.chat_id = c.chat_id 
          AND cm2.user_id != $1
          LIMIT 1
        ) as other_user_photo
      FROM chats c
      INNER JOIN chat_members cm ON c.chat_id = cm.chat_id
      WHERE cm.user_id = $1
      ORDER BY last_message_time DESC NULLS LAST
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get self chat for user (or create if doesn't exist)
  static async getOrCreateSelfChat(userId) {
    // Check if self chat exists
    const checkQuery = `
      SELECT c.chat_id
      FROM chats c
      INNER JOIN chat_members cm ON c.chat_id = cm.chat_id
      WHERE c.type = 'self' AND cm.user_id = $1
      LIMIT 1
    `;
    const existing = await pool.query(checkQuery, [userId]);

    if (existing.rows.length > 0) {
      return existing.rows[0].chat_id;
    }

    // Create new self chat
    const chat = await this.createChat('self', userId);
    
    // Add user as member
    await pool.query(
      'INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, $3)',
      [chat.chat_id, userId, 'admin']
    );

    return chat.chat_id;
  }

  // Get chat with full details including participants
  static async getChatWithDetails(chatId, userId) {
    const query = `
      SELECT 
        c.chat_id,
        c.type,
        c.title,
        c.avatar,
        c.created_by,
        c.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', u.id,
              'username', u.username,
              'email', u.email,
              'role', cm.role
            )
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) as participants
      FROM chats c
      LEFT JOIN chat_members cm ON c.chat_id = cm.chat_id
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE c.chat_id = $1
      GROUP BY c.chat_id
    `;
    const result = await pool.query(query, [chatId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const chat = result.rows[0];
    
    // Generate title based on chat type
    if (chat.type === 'self') {
      chat.display_title = 'You';
    } else if (chat.type === 'private') {
      // For 1-to-1, show the other user's name
      const otherUser = chat.participants.find(p => p.user_id !== userId);
      if (otherUser) {
        chat.display_title = otherUser.username || otherUser.email || 'User';
        chat.other_user = otherUser;
      } else {
        chat.display_title = 'Private Chat';
      }
    } else {
      // For group, use the group title
      chat.display_title = chat.title || 'Group Chat';
    }

    return chat;
  }

  // Add member to chat
  static async addMember(chatId, userId, role = 'member') {
    const query = `
      INSERT INTO chat_members (chat_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (chat_id, user_id) DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [chatId, userId, role]);
    return result.rows[0];
  }

  // Check if user is member of chat
  static async isMember(chatId, userId) {
    const query = `
      SELECT 1 FROM chat_members
      WHERE chat_id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [chatId, userId]);
    return result.rows.length > 0;
  }

  // Update chat
  static async updateChat(chatId, title, avatar) {
    const query = `
      UPDATE chats
      SET title = COALESCE($1, title),
          avatar = COALESCE($2, avatar),
          updated_at = NOW()
      WHERE chat_id = $3
      RETURNING chat_id, type, title, avatar
    `;
    const result = await pool.query(query, [title, avatar, chatId]);
    return result.rows[0];
  }

  // Delete chat
  static async deleteChat(chatId) {
    const query = 'DELETE FROM chats WHERE chat_id = $1 RETURNING chat_id';
    const result = await pool.query(query, [chatId]);
    return result.rows[0];
  }

  // Get or create 1-to-1 chat between two users
  static async getOrCreateSingleChat(userId, otherUserId) {
    // Check if chat exists between these two users
    const checkQuery = `
      SELECT c.chat_id
      FROM chats c
      WHERE c.type = 'private'
      AND EXISTS (
        SELECT 1 FROM chat_members WHERE chat_id = c.chat_id AND user_id = $1
      )
      AND EXISTS (
        SELECT 1 FROM chat_members WHERE chat_id = c.chat_id AND user_id = $2
      )
      LIMIT 1
    `;
    const existing = await pool.query(checkQuery, [userId, otherUserId]);

    if (existing.rows.length > 0) {
      return existing.rows[0].chat_id;
    }

    // Create new private chat (1-to-1)
    const chat = await this.createChat('private', userId);
    
    // Add both users as members
    await pool.query(
      'INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, $3)',
      [chat.chat_id, userId, 'admin']
    );
    await pool.query(
      'INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, $3)',
      [chat.chat_id, otherUserId, 'member']
    );

    return chat.chat_id;
  }

  // Get all participants of a chat
  static async getChatParticipants(chatId) {
    const query = `
      SELECT cm.user_id, cm.role, u.username, u.email, u.profile_photo
      FROM chat_members cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.chat_id = $1
      ORDER BY cm.role DESC, u.username ASC
    `;
    const result = await pool.query(query, [chatId]);
    return result.rows;
  }
}

module.exports = Chat;
