require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const authRoutes = require('./src/routes/authRoutes');
require('./src/config/firebase'); // Initialize Firebase
const { connectRedis } = require('./src/config/redis'); // Redis for caching

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression()); // Compress all responses
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Add size limit

// Make io accessible to routes
app.set('io', io);

// Routes
const profileRoutes = require('./src/routes/profileRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const fcmRoutes = require('./src/routes/fcmRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/fcm', fcmRoutes);
app.use('/api', uploadRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Teamly API Docs',
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('🔴 Unhandled error:', err);
  console.error('Error stack:', err.stack);
  
  // Ensure we send JSON response
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Socket.IO connection handling
const userSockets = new Map(); // userId -> Set of socketIds (for multiple devices)

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // User authentication and registration
  socket.on('register', (userId) => {
    const userIdStr = userId.toString();
    
    // Add socket to user's room for broadcasting
    socket.join(`user_${userIdStr}`);
    
    // Track socket in map (support multiple devices)
    if (!userSockets.has(userIdStr)) {
      userSockets.set(userIdStr, new Set());
    }
    userSockets.get(userIdStr).add(socket.id);
    
    socket.userId = userId;
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    console.log(`📱 User ${userId} now has ${userSockets.get(userIdStr).size} active device(s)`);
  });

  // Join chat room
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`👥 User ${socket.userId} joined chat ${chatId}`);
  });

  // Leave chat room (but stay connected to user room)
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`👋 User ${socket.userId} left chat ${chatId} (but still connected)`);
  });

  // Typing indicator
  socket.on('typing', ({ chatId, userId, isTyping }) => {
    socket.to(`chat_${chatId}`).emit('user_typing', { userId, isTyping });
  });

  // Clear unread count
  socket.on('clear_unread', async ({ chatId }) => {
    if (socket.userId) {
      const userRoom = `user_${socket.userId}`;
      
      // Get the latest chat info to send back
      const Chat = require('./src/models/Chat');
      try {
        const userChats = await Chat.getUserChats(socket.userId);
        const chat = userChats.find(c => c.chat_id.toString() === chatId.toString());
        
        if (chat) {
          // Send updated chat info with unread count = 0
          io.to(userRoom).emit('chat_list_update', {
            chatId: chatId,
            lastMessage: chat.last_message,
            lastMessageTime: chat.last_message_time,
            senderName: chat.other_user_name || 'User',
            unreadCount: 0,
          });
          console.log(`🔔 Cleared unread for user ${socket.userId} in chat ${chatId}`);
        }
      } catch (error) {
        console.error('Error clearing unread:', error);
        // Fallback to simple clear
        io.to(userRoom).emit('clear_unread_response', { chatId });
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      const userIdStr = socket.userId.toString();
      const userSocketSet = userSockets.get(userIdStr);
      
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userIdStr);
          console.log(`❌ User ${socket.userId} fully disconnected (all devices)`);
        } else {
          console.log(`📱 User ${socket.userId} disconnected one device (${userSocketSet.size} remaining)`);
        }
      }
    }
  });
});

// Export io for use in controllers
global.io = io;
global.userSockets = userSockets;

// Initialize Redis (optional - app works without it)
connectRedis().catch(err => {
  console.log('⚠️ Redis connection failed, continuing without cache:', err.message);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔌 Socket.IO enabled`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Access from network: http://192.168.10.194:${PORT}`);
});
