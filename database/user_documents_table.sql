-- User Documents Table
-- Stores metadata for all user-uploaded files
-- Actual files are stored in Firebase Storage

CREATE TABLE user_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- File metadata (NOT the file itself)
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document')),
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL, -- bytes
  
  -- Firebase Storage URLs (NOT base64 or blobs)
  firebase_url TEXT NOT NULL,
  firebase_path TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Optional metadata
  duration INT, -- for audio/video (seconds)
  width INT, -- for images/videos
  height INT, -- for images/videos
  
  -- Tracking
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reference_count INT DEFAULT 0 -- how many messages reference this
);

CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX idx_user_documents_file_type ON user_documents(file_type);
CREATE INDEX idx_user_documents_upload_date ON user_documents(upload_date DESC);

-- Add document reference to messages table
ALTER TABLE messages 
  ADD COLUMN document_id UUID REFERENCES user_documents(document_id) ON DELETE SET NULL;

CREATE INDEX idx_messages_document_id ON messages(document_id);
