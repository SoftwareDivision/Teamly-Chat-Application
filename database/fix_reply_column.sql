-- Fix: Add reply_to_message_id column (alias for reply_to)
-- This fixes the "column m.reply_to_message_id does not exist" error

ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS reply_to_message_id INT REFERENCES messages(message_id);

-- Copy data from reply_to to reply_to_message_id if reply_to exists
UPDATE messages 
SET reply_to_message_id = reply_to 
WHERE reply_to IS NOT NULL AND reply_to_message_id IS NULL;

-- Optional: You can drop the old reply_to column if you want
-- ALTER TABLE messages DROP COLUMN IF EXISTS reply_to;
