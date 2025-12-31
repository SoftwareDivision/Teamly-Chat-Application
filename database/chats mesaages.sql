CREATE TABLE chats (
  chat_id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('self', 'private', 'group')),
  title VARCHAR(255),              -- NULL for self/private, name for group
  avatar TEXT,                     -- Group photo (base64)
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_chats_type ON chats(type);
CREATE INDEX idx_chats_created_by ON chats(created_by);


SELECT * FROM chats;