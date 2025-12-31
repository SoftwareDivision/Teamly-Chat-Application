export interface IAuthStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
}
export declare class AuthService {
    private static storage;
    static setStorage(storage: IAuthStorage): void;
    static saveToken(token: string): Promise<void>;
    static getToken(): Promise<string | null>;
    static saveRefreshToken(refreshToken: string): Promise<void>;
    static getRefreshToken(): Promise<string | null>;
    static saveEmail(email: string): Promise<void>;
    static getEmail(): Promise<string | null>;
    static saveUserData(userData: any): Promise<void>;
    static getUserData(): Promise<any | null>;
    static isAuthenticated(): Promise<boolean>;
    static isProfileCompleted(): Promise<boolean>;
    static logout(): Promise<void>;
    static clearAll(): Promise<void>;
}
