export interface MessageModel {
    id: string;
    text: string;
    timestamp: Date;
    isSent: boolean;
    senderName?: string;
    status?: 'pending' | 'sent' | 'delivered' | 'read';
    documentId?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: 'image' | 'video' | 'audio' | 'document';
    thumbnailUrl?: string;
    driveLink?: string;
    driveFileId?: string;
    replyTo?: {
        id: string;
        text: string;
        senderName?: string;
    };
}
