const admin = require('../config/firebase'); // Use existing Firebase Admin instance
const path = require('path');

const bucket = admin.storage().bucket();

class FirebaseStorageService {
  /**
   * Upload file to Firebase Storage
   * @param {Buffer} fileBuffer - File buffer (NOT base64)
   * @param {string} fileName - Original file name
   * @param {string} mimeType - MIME type
   * @param {string} folder - Folder path (e.g., 'images', 'documents')
   * @param {string} userId - User ID for organization
   * @returns {Promise<{url: string, path: string}>}
   */
  static async uploadFile(fileBuffer, fileName, mimeType, folder, userId) {
    try {
      // Generate unique file path
      const timestamp = Date.now();
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
      const firebasePath = `${folder}/${userId}/${timestamp}_${sanitizedName}${ext}`;

      // Upload to Firebase Storage
      const file = bucket.file(firebasePath);
      
      await file.save(fileBuffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            originalName: fileName,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          }
        },
        public: false, // Not publicly accessible
      });

      // Generate signed URL (valid for 7 days)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log(`✅ File uploaded to Firebase: ${firebasePath}`);
      
      return {
        url,
        path: firebasePath,
      };
    } catch (error) {
      console.error('❌ Firebase upload error:', error);
      throw new Error('Failed to upload file to Firebase Storage');
    }
  }

  /**
   * Delete file from Firebase Storage
   * @param {string} firebasePath - Path to file in Firebase
   */
  static async deleteFile(firebasePath) {
    try {
      const file = bucket.file(firebasePath);
      await file.delete();
      console.log(`🗑️ File deleted from Firebase: ${firebasePath}`);
      return true;
    } catch (error) {
      console.error('❌ Firebase delete error:', error);
      return false;
    }
  }

  /**
   * Generate new signed URL for existing file
   * @param {string} firebasePath - Path to file in Firebase
   * @param {number} expiryDays - Days until URL expires
   */
  static async getSignedUrl(firebasePath, expiryDays = 7) {
    try {
      const file = bucket.file(firebasePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
      });
      return url;
    } catch (error) {
      console.error('❌ Firebase signed URL error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Get file metadata
   * @param {string} firebasePath - Path to file in Firebase
   */
  static async getFileMetadata(firebasePath) {
    try {
      const file = bucket.file(firebasePath);
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error('❌ Firebase metadata error:', error);
      return null;
    }
  }
}

module.exports = FirebaseStorageService;
