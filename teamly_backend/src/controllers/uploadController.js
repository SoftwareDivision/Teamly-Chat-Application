const multer = require('multer');
const UserDocument = require('../models/UserDocument');
const FirebaseStorageService = require('../services/firebaseStorageService');

// Configure multer to use memory storage (NOT disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

class UploadController {
  /**
   * Upload file endpoint
   * POST /api/upload
   * Body: multipart/form-data with 'file' field
   */
  static uploadMiddleware = upload.single('file');

  static async uploadFile(req, res) {
    try {
      const userId = req.user.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided',
        });
      }

      console.log(`📤 Uploading file: ${file.originalname} (${file.size} bytes)`);

      // Determine file type and folder
      const fileType = UploadController.getFileType(file.mimetype);
      const folder = UploadController.getFolderByType(fileType);

      // Upload to Firebase Storage (file.buffer is NOT base64, it's a Buffer)
      const { url, path: firebasePath } = await FirebaseStorageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        folder,
        userId
      );

      // Save metadata to PostgreSQL (NOT the file)
      const document = await UserDocument.createDocument({
        userId,
        fileName: file.originalname,
        fileType,
        mimeType: file.mimetype,
        fileSize: file.size,
        firebaseUrl: url,
        firebasePath,
      });

      console.log(`✅ Document created: ${document.document_id}`);

      res.status(201).json({
        success: true,
        document: {
          documentId: document.document_id,
          fileName: document.file_name,
          fileType: document.file_type,
          fileSize: document.file_size,
          url: document.firebase_url,
          uploadDate: document.upload_date,
        },
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload file',
      });
    }
  }

  /**
   * Get user's documents
   * GET /api/documents?type=image&limit=50&offset=0
   */
  static async getUserDocuments(req, res) {
    try {
      const userId = req.user.userId;
      const { type, limit = 50, offset = 0 } = req.query;

      const documents = await UserDocument.getUserDocuments(
        userId,
        type,
        parseInt(limit),
        parseInt(offset)
      );

      res.status(200).json({
        success: true,
        documents: documents.map(doc => ({
          documentId: doc.document_id,
          fileName: doc.file_name,
          fileType: doc.file_type,
          fileSize: doc.file_size,
          url: doc.firebase_url,
          thumbnailUrl: doc.thumbnail_url,
          uploadDate: doc.upload_date,
        })),
      });
    } catch (error) {
      console.error('❌ Get documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get documents',
      });
    }
  }

  /**
   * Get user's storage usage
   * GET /api/storage/usage
   */
  static async getStorageUsage(req, res) {
    try {
      const userId = req.user.userId;
      const totalBytes = await UserDocument.getUserStorageUsage(userId);

      res.status(200).json({
        success: true,
        usage: {
          bytes: totalBytes,
          megabytes: (totalBytes / (1024 * 1024)).toFixed(2),
          gigabytes: (totalBytes / (1024 * 1024 * 1024)).toFixed(2),
        },
      });
    } catch (error) {
      console.error('❌ Storage usage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get storage usage',
      });
    }
  }

  // Helper: Determine file type from MIME
  static getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  // Helper: Get folder name by file type
  static getFolderByType(fileType) {
    const folders = {
      image: 'images',
      video: 'videos',
      audio: 'audio',
      document: 'documents',
    };
    return folders[fileType] || 'files';
  }
}

module.exports = UploadController;
