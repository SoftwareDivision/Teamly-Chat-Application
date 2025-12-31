// Model for Message data
export interface MessageModel {
  id: string;
  text: string;
  timestamp: Date;
  isSent: boolean; // true = sent by user, false = received
  senderName?: string; // Name of the person who sent this message
  status?: 'pending' | 'sent' | 'delivered' | 'read'; // Message status
  // pending = clock icon (sending)
  // sent = single tick (sent to server)
  // delivered = double gray ticks (delivered to recipient)
  // read = double blue ticks (read by recipient)
  
  // Media fields
  documentId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: 'image' | 'video' | 'audio' | 'document';
  thumbnailUrl?: string;
  
  // Google Drive fields
  driveLink?: string;
  driveFileId?: string;
  
  replyTo?: {
    id: string;
    text: string;
    senderName?: string;
  };
}
