const pool = require('../config/database');

class UserDocument {
  // Create new document record (after Firebase upload)
  static async createDocument({
    userId,
    fileName,
    fileType,
    mimeType,
    fileSize,
    firebaseUrl,
    firebasePath,
    thumbnailUrl = null,
    duration = null,
    width = null,
    height = null,
  }) {
    const query = `
      INSERT INTO user_documents (
        user_id, file_name, file_type, mime_type, file_size,
        firebase_url, firebase_path, thumbnail_url,
        duration, width, height, reference_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId, fileName, fileType, mimeType, fileSize,
      firebaseUrl, firebasePath, thumbnailUrl,
      duration, width, height
    ]);
    
    return result.rows[0];
  }

  // Get document by ID
  static async getDocumentById(documentId) {
    const query = `
      SELECT * FROM user_documents
      WHERE document_id = $1
    `;
    const result = await pool.query(query, [documentId]);
    return result.rows[0];
  }

  // Get all documents for a user
  static async getUserDocuments(userId, fileType = null, limit = 50, offset = 0) {
    let query = `
      SELECT * FROM user_documents
      WHERE user_id = $1
    `;
    const params = [userId];
    
    if (fileType) {
      query += ` AND file_type = $2`;
      params.push(fileType);
      query += ` ORDER BY upload_date DESC LIMIT $3 OFFSET $4`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY upload_date DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Increment reference count (when message uses this document)
  static async incrementReferenceCount(documentId) {
    const query = `
      UPDATE user_documents
      SET reference_count = reference_count + 1
      WHERE document_id = $1
      RETURNING reference_count
    `;
    const result = await pool.query(query, [documentId]);
    return result.rows[0];
  }

  // Decrement reference count (when message is deleted)
  static async decrementReferenceCount(documentId) {
    const query = `
      UPDATE user_documents
      SET reference_count = GREATEST(reference_count - 1, 0)
      WHERE document_id = $1
      RETURNING reference_count, firebase_path
    `;
    const result = await pool.query(query, [documentId]);
    return result.rows[0];
  }

  // Delete document (only if reference_count = 0)
  static async deleteDocument(documentId) {
    const query = `
      DELETE FROM user_documents
      WHERE document_id = $1 AND reference_count = 0
      RETURNING firebase_path
    `;
    const result = await pool.query(query, [documentId]);
    return result.rows[0];
  }

  // Get user's total storage usage
  static async getUserStorageUsage(userId) {
    const query = `
      SELECT COALESCE(SUM(file_size), 0) as total_bytes
      FROM user_documents
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].total_bytes);
  }

  // Find orphaned documents (reference_count = 0, older than X days)
  static async findOrphanedDocuments(daysOld = 7) {
    const query = `
      SELECT document_id, firebase_path
      FROM user_documents
      WHERE reference_count = 0
        AND upload_date < NOW() - INTERVAL '${daysOld} days'
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = UserDocument;
