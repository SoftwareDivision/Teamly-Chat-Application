const Chat = require('../models/Chat');
const Message = require('../models/Message');
const MessageStatus = require('../models/MessageStatus');

class ChatController {
  // Get or create self chat
  static async initSelfChat(req, res) {
    try {
      const userId = req.user.userId;

      const chatId = await Chat.getOrCreateSelfChat(userId);

      res.status(200).json({
        success: true,
        chatId: chatId,
        message: 'Self chat initialized',
      });
    } catch (error) {
      console.error('Init self chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize self chat',
      });
    }
  }

  // Get single chat details (universal for all types)
  static async getChatDetails(req, res) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;

      // Check if user is member
      const isMember = await Chat.isMember(chatId, userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const chat = await Chat.getChatWithDetails(chatId, userId);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat not found',
        });
      }

      res.status(200).json({
        success: true,
        chat: {
          chatId: chat.chat_id,
          type: chat.type,
          title: chat.display_title,
          avatar: chat.avatar,
          participants: chat.participants,
          otherUser: chat.other_user,
          createdAt: chat.created_at,
        },
      });
    } catch (error) {
      console.error('Get chat details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chat details',
      });
    }
  }

  // Get all chats for user
  static async getUserChats(req, res) {
    try {
      const userId = req.user.userId;

      const chats = await Chat.getUserChats(userId);
      console.log(`📋 Found ${chats.length} chats for user ${userId}`);

      const formattedChats = chats.map(chat => {
        let chatName = chat.title;
        let chatAvatar = chat.avatar;
        let otherUserEmail = null;

        if (chat.type === 'self') {
          chatName = 'My Notes';
        } else if (chat.type === 'private') {
          // Use other user's name for private chats
          chatName = chat.other_user_name || chat.title || 'Private Chat';
          chatAvatar = chat.other_user_photo || chat.avatar;
          otherUserEmail = chat.other_user_email;
        }

        return {
          chatId: chat.chat_id,
          type: chat.type,
          name: chatName,
          avatar: chatAvatar,
          lastMessage: chat.last_message,
          lastMessageTime: chat.last_message_time,
          unreadCount: parseInt(chat.unread_count) || 0,
          otherUserEmail: otherUserEmail,
        };
      });

      res.status(200).json({
        success: true,
        chats: formattedChats,
      });
    } catch (error) {
      console.error('Get user chats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chats',
      });
    }
  }

  // Get chat messages
  static async getChatMessages(req, res) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const chat = await Chat.getChatById(chatId);
      const messages = await Message.getChatMessages(chatId, limit, offset);
      console.log(`💬 Fetched ${messages.length} messages for chat ${chatId}, user ${userId}`);

      // WhatsApp-style status logic
      const messagesWithStatus = await Promise.all(
        messages.map(async (msg) => {
          let status = 'sent';
          
          if (msg.sender_id === userId) {
            // Messages I sent - check recipient status
            if (chat.type === 'self') {
              status = 'read'; // Self chat always read
            } else {
              // Get all recipient statuses (exclude sender)
              const allStatuses = await MessageStatus.getAllMessageStatuses(msg.message_id);
              const recipientStatuses = allStatuses.filter(s => s.user_id !== userId);
              
              if (recipientStatuses.length > 0) {
                // WhatsApp logic: show lowest status
                // All read → blue ticks, any delivered → gray ticks, else → single tick
                if (recipientStatuses.every(s => s.status === 'read')) {
                  status = 'read';
                } else if (recipientStatuses.some(s => s.status === 'delivered' || s.status === 'read')) {
                  status = 'delivered';
                } else {
                  status = 'sent';
                }
              }
            }
          } else {
            // Messages sent to me - show my status
            const myStatus = await MessageStatus.getMessageStatus(msg.message_id, userId);
            status = myStatus?.status || 'delivered';
          }

          return {
            id: msg.message_id.toString(),
            text: msg.message_text,
            type: msg.message_type,
            fileUrl: msg.firebase_url,
            fileName: msg.file_name,
            fileSize: msg.file_size,
            timestamp: msg.created_at,
            isSent: msg.sender_id === userId,
            status: status,
            senderName: msg.sender_name,
            senderAvatar: msg.sender_avatar,
            replyTo: msg.reply_to_message_id ? {
              id: msg.reply_to_message_id.toString(),
              text: msg.reply_message_text || '',
              senderName: msg.reply_sender_name || 'User',
            } : undefined,
          };
        })
      );

      console.log(`✅ Returning ${messagesWithStatus.length} formatted messages`);

      res.status(200).json({
        success: true,
        messages: messagesWithStatus,
      });
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get messages',
      });
    }
  }

  // Send message
  static async sendMessage(req, res) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;
      const { text, type, firebaseUrl, firebasePath, fileName, fileSize, documentId, replyToId } = req.body;
      
      // Invalidate cache for this chat
      const { invalidateCache } = require('../middleware/cache');
      await invalidateCache(`cache:*:${chatId}*`).catch(console.error);

      if (!text && !firebaseUrl && !documentId) {
        return res.status(400).json({
          success: false,
          message: 'Message text, file, or documentId is required',
        });
      }

      // If documentId provided, increment reference count
      if (documentId) {
        const UserDocument = require('../models/UserDocument');
        await UserDocument.incrementReferenceCount(documentId);
      }

      // Get chat type
      const chat = await Chat.getChatById(chatId);

      // Create message (with optional documentId and replyToId)
      const message = await Message.createMessage(
        chatId,
        userId,
        text || '',
        type || 'text',
        firebaseUrl,
        firebasePath,
        fileName,
        fileSize,
        documentId,
        replyToId
      );

      // Create status for sender
      await MessageStatus.createStatus(message.message_id, userId, 'sent');

      // Get all chat participants except sender
      const participants = await Chat.getChatParticipants(chatId);
      const recipients = participants.filter(p => p.user_id !== userId);

      // Create 'delivered' status for all recipients
      for (const recipient of recipients) {
        await MessageStatus.createStatus(message.message_id, recipient.user_id, 'delivered');
      }

      // Determine initial status for response
      let initialStatus = 'sent';
      if (chat.type === 'self') {
        // Self chat shows as read immediately
        await MessageStatus.updateStatus(message.message_id, userId, 'read');
        initialStatus = 'read';
      } else if (recipients.length > 0) {
        // Private/Group chat shows as delivered
        initialStatus = 'delivered';
      }

      // Get reply message details if replyToId exists
      let replyToData = null;
      if (replyToId) {
        const replyMessage = await Message.getMessageById(replyToId);
        console.log('📝 Reply message:', replyMessage);
        if (replyMessage) {
          const User = require('../models/User');
          const replySender = await User.findById(replyMessage.sender_id);
          console.log('👤 Reply sender:', replySender);
          replyToData = {
            id: replyMessage.message_id.toString(),
            text: replyMessage.message_text,
            senderName: replySender?.username || replySender?.email?.split('@')[0] || 'User',
          };
          console.log('📦 ReplyToData:', replyToData);
        }
      }

      const responseMessage = {
        id: message.message_id.toString(),
        text: message.message_text,
        type: message.message_type,
        fileUrl: message.firebase_url,
        fileName: message.file_name,
        timestamp: message.created_at,
        isSent: true,
        status: initialStatus,
        senderId: userId,
        replyTo: replyToData,
      };

      res.status(201).json({
        success: true,
        message: responseMessage,
      });

      // Update sender's chat list via socket
      if (global.io) {
        const senderRoom = `user_${userId}`;
        global.io.to(senderRoom).emit('chat_list_update', {
          chatId: chatId,
          lastMessage: message.message_text,
          lastMessageTime: message.created_at,
          senderName: 'You',
          unreadCount: 0, // Sender always has 0 unread for their own messages
        });
      }

      // Send notifications only for private/group chats (not self chat)
      if (chat.type !== 'self' && recipients.length > 0) {
        const User = require('../models/User');
        const FCMToken = require('../models/FCMToken');
        const FCMService = require('../services/fcmService');
        
        const sender = await User.findById(userId);
        const senderName = sender?.username || 'Someone';
        
        for (const recipient of recipients) {
          // Get FRESH unread count from database (after message was created)
          const recipientChats = await Chat.getUserChats(recipient.user_id);
          const recipientChat = recipientChats.find(c => c.chat_id.toString() === chatId.toString());
          const unreadCount = recipientChat ? parseInt(recipientChat.unread_count) || 0 : 1;
          
          console.log(`📊 Recipient ${recipient.user_id} unread count: ${unreadCount} (from DB)`);
          
          // Send Socket.IO real-time update
          if (global.io) {
            const recipientRoom = `user_${recipient.user_id}`;
            
            console.log(`🔔 Emitting new_message to room: ${recipientRoom}`);
            
            // New message event for chat screen
            global.io.to(recipientRoom).emit('new_message', {
              id: message.message_id.toString(),
              text: message.message_text,
              type: message.message_type,
              fileUrl: message.firebase_url,
              fileName: message.file_name,
              timestamp: message.created_at,
              isSent: false,
              status: 'delivered',
              senderId: userId,
              senderName: senderName,
              chatId: chatId,
              replyTo: replyToData,
            });
            
            // Chat list update with badge count
            global.io.to(recipientRoom).emit('chat_list_update', {
              chatId: chatId,
              lastMessage: message.message_text,
              lastMessageTime: message.created_at,
              senderName: senderName,
              unreadCount: unreadCount,
            });
            
            console.log(`📤 Sent new_message + chat_list_update to user ${recipient.user_id} | Room: ${recipientRoom} | Badge: ${unreadCount}`);
          }

          // Send FCM push notification
          try {
            const fcmTokens = await FCMToken.getUserFCMTokens(recipient.user_id);
            if (fcmTokens.length > 0) {
              const messagePreview = text?.substring(0, 100) || 'Sent a message';
              const notificationTitle = chat.type === 'group' 
                ? `${senderName} in ${chat.title || 'Group'}`
                : senderName;
              
              await FCMService.sendMulticast(
                fcmTokens,
                notificationTitle,
                messagePreview,
                {
                  chatId: chatId.toString(),
                  messageId: message.message_id.toString(),
                  senderId: userId.toString(),
                  type: 'new_message',
                }
              );
              console.log(`🔔 FCM sent to user ${recipient.user_id}`);
            }
          } catch (fcmError) {
            console.error(`❌ FCM error for user ${recipient.user_id}:`, fcmError.message);
          }
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
      });
    }
  }

  // Update message status (single message)
  static async updateMessageStatus(req, res) {
    try {
      const userId = req.user.userId;
      const { messageId } = req.params;
      const { status } = req.body;

      await MessageStatus.updateStatus(messageId, userId, status);
      const message = await Message.getMessageById(messageId);
      
      if (message && message.sender_id !== userId && global.io) {
        // Only notify sender if I'm not the sender (avoid self-notification)
        // Get all statuses to determine what to show sender (WhatsApp logic)
        const allStatuses = await MessageStatus.getAllMessageStatuses(messageId);
        const recipientStatuses = allStatuses.filter(s => s.user_id !== message.sender_id);
        
        let finalStatus = 'sent';
        if (recipientStatuses.every(s => s.status === 'read')) {
          finalStatus = 'read'; // All read → blue ticks
        } else if (recipientStatuses.some(s => s.status === 'delivered' || s.status === 'read')) {
          finalStatus = 'delivered'; // Any delivered → gray ticks
        }
        
        // Emit to sender's room
        const senderRoom = `user_${message.sender_id}`;
        global.io.to(senderRoom).emit('message_status_update', {
          messageId: messageId.toString(),
          status: finalStatus,
          chatId: message.chat_id.toString(),
        });
        console.log(`✅ Status update (${finalStatus}) sent to sender ${message.sender_id}`);
      }

      res.status(200).json({
        success: true,
        message: 'Status updated',
      });
    } catch (error) {
      console.error('Update message status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update status',
      });
    }
  }

  // Delete message - WhatsApp style (delete for me / delete for everyone)
  static async deleteMessage(req, res) {
    try {
      const userId = req.user.userId;
      const { messageId } = req.params;
      const { deleteType } = req.body; // 'forMe' or 'forEveryone'

      // Get message details before deleting
      const message = await Message.getMessageById(messageId);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        });
      }

      const chatId = message.chat_id;

      // Delete from database
      const deleted = await Message.deleteMessage(messageId, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Message not found or unauthorized',
        });
      }

      // If "delete for everyone", notify all chat participants via Socket.IO
      if (deleteType === 'forEveryone' && global.io) {
        const participants = await Chat.getChatParticipants(chatId);
        
        for (const participant of participants) {
          const userRoom = `user_${participant.user_id}`;
          global.io.to(userRoom).emit('message_deleted', {
            messageId: messageId.toString(),
            chatId: chatId.toString(),
            deletedBy: userId,
          });
          console.log(`🗑️ Sent message_deleted to user ${participant.user_id}`);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Message deleted',
        firebasePath: deleted.firebase_path, // For deleting from Firebase Storage
        deleteType: deleteType || 'forMe',
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete message',
      });
    }
  }

  // Create 1-to-1 chat by email
  static async createSingleChatByEmail(req, res) {
    try {
      const userId = req.user.userId;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const User = require('../models/User');

      // Find user by email
      const otherUser = await User.findByEmailExcludingSelf(email, userId);

      if (!otherUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this email',
        });
      }

      // Create or get existing chat
      const chatId = await Chat.getOrCreateSingleChat(userId, otherUser.id);

      res.status(200).json({
        success: true,
        chatId: chatId,
        user: {
          id: otherUser.id,
          email: otherUser.email,
          username: otherUser.username,
          profilePhoto: otherUser.profile_photo,
        },
      });
    } catch (error) {
      console.error('Create single chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create chat',
      });
    }
  }

  // Get chat members
  static async getChatMembers(req, res) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;

      // Check if user is member
      const isMember = await Chat.isMember(chatId, userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const members = await Chat.getChatParticipants(chatId);

      const formattedMembers = members.map(member => {
        let profilePhoto = null;
        
        // Format profile photo if it exists
        if (member.profile_photo) {
          // If it's already a data URI, use it as is
          if (member.profile_photo.startsWith('data:')) {
            profilePhoto = member.profile_photo;
          } else {
            // Otherwise, assume it's base64 and format it
            profilePhoto = `data:image/jpeg;base64,${member.profile_photo}`;
          }
        }
        
        return {
          user_id: member.user_id,
          username: member.username,
          email: member.email,
          profile_photo: profilePhoto,
          role: member.role,
        };
      });

      res.status(200).json({
        success: true,
        members: formattedMembers,
      });
    } catch (error) {
      console.error('Get chat members error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get members',
      });
    }
  }

  // Create group chat
  static async createGroupChat(req, res) {
    console.log('🔵 createGroupChat called');
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);
    
    try {
      const userId = req.user.userId;
      const { groupName, memberEmails } = req.body;

      console.log('📝 Creating group:', { groupName, memberEmails, userId });

      if (!groupName || !memberEmails || memberEmails.length === 0) {
        console.log('❌ Validation failed: missing groupName or memberEmails');
        return res.status(400).json({
          success: false,
          message: 'Group name and members are required',
        });
      }

      if (!Array.isArray(memberEmails)) {
        console.log('❌ Validation failed: memberEmails is not an array');
        return res.status(400).json({
          success: false,
          message: 'memberEmails must be an array',
        });
      }

      const User = require('../models/User');

      // Create group chat
      let chat;
      try {
        console.log('Creating chat with:', { type: 'group', userId, groupName });
        chat = await Chat.createChat('group', userId, groupName);
        console.log('✅ Group chat created:', chat.chat_id);
      } catch (dbError) {
        console.error('❌ Database error creating chat:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create group chat',
          error: dbError.message,
        });
      }

      // Add creator as admin
      try {
        await Chat.addMember(chat.chat_id, userId, 'admin');
        console.log('✅ Creator added as admin');
      } catch (memberError) {
        console.error('⚠️ Error adding creator as admin:', memberError);
      }

      // Add other members
      const addedMembers = [];
      const failedMembers = [];
      
      for (const email of memberEmails) {
        try {
          const trimmedEmail = email.trim().toLowerCase();
          console.log(`🔍 Looking up user with email: "${trimmedEmail}" (original: "${email}")`);
          
          // First, let's check if user exists
          const user = await User.findByEmail(trimmedEmail);
          console.log(`Database lookup result for ${trimmedEmail}:`, user);
          
          if (user && user.id !== userId) {
            // Add to group
            const memberResult = await Chat.addMember(chat.chat_id, user.id, 'member');
            console.log(`✅ Added ${user.username} (${trimmedEmail}) to group ${groupName}`, memberResult);
            addedMembers.push({ email: trimmedEmail, username: user.username, userId: user.id });
          } else if (user && user.id === userId) {
            console.log(`⚠️ Skipping creator's own email: ${trimmedEmail}`);
          } else {
            console.log(`❌ User with email ${trimmedEmail} not found in database`);
            failedMembers.push(trimmedEmail);
          }
        } catch (userError) {
          console.error(`❌ Error processing user ${email}:`, userError);
          failedMembers.push(email);
        }
      }

      const responseData = {
        success: true,
        chatId: chat.chat_id,
        groupName: groupName,
        message: 'Group created successfully',
        addedMembers: addedMembers,
        failedMembers: failedMembers,
      };
      
      console.log('📤 Sending response:', responseData);
      res.status(201).json(responseData);
    } catch (error) {
      console.error('❌ Create group chat error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to create group',
        error: error.message,
      });
    }
  }

  // Delete chat
  static async deleteChat(req, res) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;

      console.log(`🗑️ Deleting chat ${chatId} for user ${userId}`);

      // Check if user is a member of the chat
      const Chat = require('../models/Chat');
      const isMember = await Chat.isMember(chatId, userId);
      
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this chat',
        });
      }

      // Delete the chat (this will cascade delete messages and members)
      const deleted = await Chat.deleteChat(chatId);

      if (deleted) {
        console.log(`✅ Chat ${chatId} deleted successfully`);
        res.status(200).json({
          success: true,
          message: 'Chat deleted successfully',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Chat not found',
        });
      }
    } catch (error) {
      console.error('❌ Delete chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete chat',
        error: error.message,
      });
    }
  }

  // WhatsApp-style: Mark entire chat as read (batch update)
  static async markChatAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;

      console.log(`📖 Marking chat ${chatId} as read for user ${userId}`);

      const isMember = await Chat.isMember(chatId, userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Mark all unread messages as read
      const markedMessages = await MessageStatus.markChatAsRead(chatId, userId);
      console.log(`✅ Marked ${markedMessages.length} messages as read`);

      // Send blue tick updates to senders
      if (global.io && markedMessages.length > 0) {
        // Group messages by sender to reduce queries
        const senderMap = new Map();
        
        for (const { message_id } of markedMessages) {
          const message = await Message.getMessageById(message_id);
          if (message && message.sender_id !== userId) {
            if (!senderMap.has(message.sender_id)) {
              senderMap.set(message.sender_id, []);
            }
            senderMap.get(message.sender_id).push(message_id);
          }
        }
        
        // Emit status updates to each sender
        for (const [senderId, messageIds] of senderMap) {
          const senderRoom = `user_${senderId}`;
          
          for (const msgId of messageIds) {
            // Get final status for this message (check all recipients)
            const allStatuses = await MessageStatus.getAllMessageStatuses(msgId);
            const recipientStatuses = allStatuses.filter(s => s.user_id !== senderId);
            
            let finalStatus = 'sent';
            if (recipientStatuses.every(s => s.status === 'read')) {
              finalStatus = 'read'; // All read → blue ticks
            } else if (recipientStatuses.some(s => s.status === 'delivered' || s.status === 'read')) {
              finalStatus = 'delivered'; // Any delivered → gray ticks
            }
            
            global.io.to(senderRoom).emit('message_status_update', {
              messageId: msgId.toString(),
              status: finalStatus,
              chatId: chatId.toString(),
            });
          }
          
          console.log(`📤 Sent ${messageIds.length} read receipts to sender ${senderId}`);
        }
      }

      // Clear badge for current user (send complete chat info)
      if (global.io) {
        // Get updated chat info to send complete data
        const userChats = await Chat.getUserChats(userId);
        const updatedChat = userChats.find(c => c.chat_id.toString() === chatId.toString());
        
        if (updatedChat) {
          global.io.to(`user_${userId}`).emit('chat_list_update', {
            chatId: chatId.toString(),
            lastMessage: updatedChat.last_message,
            lastMessageTime: updatedChat.last_message_time,
            senderName: updatedChat.other_user_name || 'User',
            unreadCount: 0, // Should be 0 after marking as read
          });
          console.log(`🔔 Cleared badge for user ${userId} in chat ${chatId}`);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Chat marked as read',
        markedCount: markedMessages.length,
      });
    } catch (error) {
      console.error('❌ Mark chat as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark chat as read',
      });
    }
  }
}

module.exports = ChatController;
