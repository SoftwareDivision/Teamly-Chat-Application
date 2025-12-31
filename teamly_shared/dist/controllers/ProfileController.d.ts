export interface ProfileData {
    name: string;
    phone: string;
    profilePhoto?: string;
}
export declare class ProfileController {
    static validateName(name: string): {
        isValid: boolean;
        errorMessage?: string;
    };
    static validatePhone(phone: string): {
        isValid: boolean;
        errorMessage?: string;
    };
    static updateProfile(token: string, profileData: ProfileData): Promise<{
        success: boolean;
        message: string;
        user?: any;
    }>;
}
