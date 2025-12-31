const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication
router.use(authenticateToken);

// Chat routes (specific routes BEFORE dynamic routes)
router.post('/self/init', asyncHandler(ChatController.initSelfChat));
router.post('/single/create', asyncHandler(ChatController.createSingleChatByEmail));
router.post('/group/create', asyncHandler(ChatController.createGroupChat));
router.get('/list', cacheMiddleware(300), asyncHandler(ChatController.getUserChats)); // Cache for 5 minutes

// Message routes (specific routes BEFORE dynamic :chatId)
router.patch('/messages/:messageId/status', asyncHandler(ChatController.updateMessageStatus));
router.delete('/messages/:messageId', asyncHandler(ChatController.deleteMessage));

// Dynamic routes (MUST be last)
router.get('/:chatId', cacheMiddleware(600), asyncHandler(ChatController.getChatDetails)); // Cache for 10 minutes
router.get('/:chatId/members', cacheMiddleware(600), asyncHandler(ChatController.getChatMembers)); // Cache for 10 minutes
router.get('/:chatId/messages', cacheMiddleware(180), asyncHandler(ChatController.getChatMessages)); // Cache for 3 minutes
router.post('/:chatId/messages', asyncHandler(ChatController.sendMessage));
router.post('/:chatId/read', asyncHandler(ChatController.markChatAsRead));
router.delete('/:chatId', asyncHandler(ChatController.deleteChat));

module.exports = router;
