export interface SendOTPResponse {
    success: boolean;
    message: string;
    expiresIn?: number;
}
export interface VerifyOTPResponse {
    success: boolean;
    message: string;
    token?: string;
    refreshToken?: string;
    user?: {
        id: number;
        email: string;
        name?: string;
        phone?: string;
        profilePhoto?: string;
        isProfileComplete: boolean;
    };
}
export interface RefreshTokenResponse {
    success: boolean;
    token?: string;
    refreshToken?: string;
    message?: string;
}
export declare class ApiService {
    static sendOTP(email: string): Promise<SendOTPResponse>;
    static verifyOTP(email: string, otp: string): Promise<VerifyOTPResponse>;
    static refreshToken(refreshToken: string): Promise<RefreshTokenResponse>;
    static updateProfile(token: string, name: string, phone: string, profilePhoto?: string): Promise<any>;
    static getProfile(token: string): Promise<any>;
    static initSelfChat(token: string): Promise<any>;
    static getAllChats(token: string): Promise<any>;
    static createSingleChatByEmail(token: string, email: string): Promise<any>;
    static deleteChat(token: string, chatId: string): Promise<any>;
    static createGroupChat(token: string, groupName: string, memberEmails: string[]): Promise<any>;
    static getChatDetails(token: string, chatId: string): Promise<any>;
    static getChatMembers(token: string, chatId: string): Promise<any>;
    static getChatMessages(token: string, chatId: string, limit?: number, offset?: number): Promise<any>;
    static sendMessage(token: string, chatId: string, text: string, replyToId?: string): Promise<any>;
    static updateMessageStatus(token: string, messageId: string, status: string): Promise<any>;
    static deleteMessage(token: string, messageId: string): Promise<any>;
    static markChatAsRead(token: string, chatId: string): Promise<any>;
    static registerFCMToken(token: string, deviceToken: string, deviceName: string, deviceType: string): Promise<any>;
    static unregisterFCMToken(token: string, deviceToken: string): Promise<any>;
    static uploadFile(token: string, file: File): Promise<any>;
    static sendMessageWithMedia(token: string, chatId: string, text: string, documentId: string, replyToId?: string): Promise<any>;
    static getUserDocuments(token: string, type?: string, limit?: number, offset?: number): Promise<any>;
    static getStorageUsage(token: string): Promise<any>;
    static getGoogleDriveAuthUrl(token: string): Promise<any>;
    static handleGoogleDriveCallback(token: string, code: string): Promise<any>;
    static checkGoogleDriveStatus(token: string): Promise<any>;
    static getGoogleDriveToken(token: string): Promise<any>;
    static disconnectGoogleDrive(token: string): Promise<any>;
}
