export declare class SplashController {
    static getAppName(): string;
    static getLogoSize(): number;
    static getAnimationDuration(): number;
    static initializeApp(): Promise<{
        isAuthenticated: boolean;
        isProfileCompleted: boolean;
    }>;
}
