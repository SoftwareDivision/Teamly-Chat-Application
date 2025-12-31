export declare class EmailVerificationController {
    static validateEmail(email: string): boolean;
    static validateEmailWithMessage(email: string): {
        isValid: boolean;
        errorMessage?: string;
    };
    static sendVerificationCode(email: string): Promise<boolean>;
    static verifyCode(code: string, email: string): Promise<{
        success: boolean;
        token?: string;
        refreshToken?: string;
        user?: any;
    }>;
    static validateOTP(otp: string, expectedLength: number): boolean;
}
