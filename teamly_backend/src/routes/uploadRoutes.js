const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file to Firebase Storage
 *     description: Upload image, video, audio, or document file. File is stored in Firebase Storage and metadata is saved to PostgreSQL.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 100MB)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 document:
 *                   $ref: '#/components/schemas/Document'
 *       400:
 *         description: No file provided or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */
router.post(
  '/upload',
  UploadController.uploadMiddleware,
  UploadController.uploadFile
);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get user's uploaded documents
 *     description: Retrieve list of documents uploaded by the authenticated user
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, video, audio, document]
 *         description: Filter by file type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of documents to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of documents to skip
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 documents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/documents', UploadController.getUserDocuments);

/**
 * @swagger
 * /api/storage/usage:
 *   get:
 *     summary: Get user's storage usage
 *     description: Calculate total storage used by the authenticated user
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Storage usage information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 usage:
 *                   type: object
 *                   properties:
 *                     bytes:
 *                       type: integer
 *                       example: 52428800
 *                     megabytes:
 *                       type: string
 *                       example: "50.00"
 *                     gigabytes:
 *                       type: string
 *                       example: "0.05"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/storage/usage', UploadController.getStorageUsage);

module.exports = router;
