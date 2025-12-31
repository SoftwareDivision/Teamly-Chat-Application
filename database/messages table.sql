
-- Updated messages table
CREATE TABLE messages (
  message_id SERIAL PRIMARY KEY,
  chat_id INT NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document')),
  firebase_url TEXT,               -- Firebase Storage URL (for media)
  firebase_path TEXT,              -- Firebase Storage path (for deletion)
  file_name VARCHAR(255),          -- Original file name
  file_size BIGINT,                -- File size in bytes
  thumbnail_url TEXT,              -- Thumbnail for videos/images
  reply_to INT REFERENCES messages(message_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
