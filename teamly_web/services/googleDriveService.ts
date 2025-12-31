// Google Drive Service for Web
// Handles file upload to user's Google Drive

export class GoogleDriveService {
  /**
   * Upload file to Google Drive
   */
  static async uploadFileToDrive(
    file: File,
    accessToken: string
  ): Promise<{
    fileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }> {
    try {
      console.log('📤 Uploading file to Google Drive:', file.name);

      // Create metadata
      const metadata = {
        name: file.name,
        mimeType: file.type,
      };

      // Create form data
      const formData = new FormData();
      formData.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      formData.append('file', file);

      // Upload to Drive
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Drive upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ File uploaded to Drive:', data);

      return {
        fileId: data.id,
        fileName: data.name,
        fileSize: parseInt(data.size),
        mimeType: data.mimeType,
      };
    } catch (error) {
      console.error('❌ Drive upload error:', error);
      throw error;
    }
  }

  /**
   * Make file publicly accessible
   */
  static async makeFilePublic(fileId: string, accessToken: string): Promise<void> {
    try {
      console.log('🔓 Making file public:', fileId);

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to make file public: ${response.statusText}`);
      }

      console.log('✅ File is now public');
    } catch (error) {
      console.error('❌ Make public error:', error);
      throw error;
    }
  }

  /**
   * Get shareable link for file (direct download)
   */
  static getShareableLink(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  /**
   * Get view link for file (opens in browser)
   */
  static getViewLink(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  /**
   * Get file type from MIME type
   */
  static getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}
