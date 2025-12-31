"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplashController = void 0;
// Controller for Splash Screen logic
const SplashModel_1 = require("../models/SplashModel");
const authService_1 = require("../services/authService");
const apiService_1 = require("../services/apiService");
class SplashController {
    static getAppName() {
        return SplashModel_1.splashData.appName;
    }
    static getLogoSize() {
        return SplashModel_1.splashData.logoSize;
    }
    static getAnimationDuration() {
        return SplashModel_1.splashData.animationDuration;
    }
    static async initializeApp() {
        // Wait for animation to complete
        await new Promise((resolve) => {
            setTimeout(resolve, SplashModel_1.splashData.animationDuration);
        });
        // Check authentication status
        const isAuthenticated = await authService_1.AuthService.isAuthenticated();
        console.log('🔐 Token exists:', isAuthenticated);
        if (!isAuthenticated) {
            console.log('➡️ No token found, going to login');
            return { isAuthenticated: false, isProfileCompleted: false };
        }
        // Verify token is still valid by fetching profile
        try {
            let token = await authService_1.AuthService.getToken();
            if (token) {
                console.log('🔍 Validating token with API...');
                let response = await apiService_1.ApiService.getProfile(token);
                console.log('📥 Profile API response:', response.success, response.message);
                // If token expired or invalid (403), try to refresh it
                if (!response.success && (response.message?.includes('expired') || response.message?.includes('Invalid'))) {
                    console.log('🔄 Access token expired/invalid, attempting refresh...');
                    const refreshToken = await authService_1.AuthService.getRefreshToken();
                    console.log('🔑 Refresh token exists:', !!refreshToken);
                    if (refreshToken) {
                        try {
                            const refreshResponse = await apiService_1.ApiService.refreshToken(refreshToken);
                            console.log('🔄 Refresh response:', refreshResponse.success);
                            if (refreshResponse.success && refreshResponse.token) {
                                // Save new tokens
                                await authService_1.AuthService.saveToken(refreshResponse.token);
                                if (refreshResponse.refreshToken) {
                                    await authService_1.AuthService.saveRefreshToken(refreshResponse.refreshToken);
                                }
                                console.log('✅ New tokens saved');
                                // Retry getting profile with new token
                                token = refreshResponse.token;
                                response = await apiService_1.ApiService.getProfile(token);
                                console.log('📥 Retry profile response:', response.success);
                            }
                            else {
                                // Refresh failed, logout
                                console.error('❌ Token refresh failed');
                                await authService_1.AuthService.logout();
                                return { isAuthenticated: false, isProfileCompleted: false };
                            }
                        }
                        catch (refreshError) {
                            console.error('❌ Token refresh error:', refreshError);
                            await authService_1.AuthService.logout();
                            return { isAuthenticated: false, isProfileCompleted: false };
                        }
                    }
                    else {
                        // No refresh token, logout
                        console.log('❌ No refresh token, logging out');
                        await authService_1.AuthService.logout();
                        return { isAuthenticated: false, isProfileCompleted: false };
                    }
                }
                // Check if profile fetch was successful
                if (response.success && response.user) {
                    // Update local user data
                    await authService_1.AuthService.saveUserData(response.user);
                    // Check if profile is completed
                    const isProfileCompleted = !!(response.user.name && response.user.phone);
                    console.log('✅ User authenticated, profile complete:', isProfileCompleted);
                    return { isAuthenticated: true, isProfileCompleted };
                }
                else {
                    // API returned error (user not found, deleted, etc.) - clear invalid token
                    console.log('❌ Profile fetch failed:', response.message, '- clearing token');
                    await authService_1.AuthService.logout();
                    return { isAuthenticated: false, isProfileCompleted: false };
                }
            }
        }
        catch (error) {
            console.error('❌ Token validation failed:', error);
            // Token is invalid, clear it
            await authService_1.AuthService.logout();
            return { isAuthenticated: false, isProfileCompleted: false };
        }
        // Fallback - should not reach here, but clear token just in case
        console.log('⚠️ Unexpected state, clearing token');
        await authService_1.AuthService.logout();
        return { isAuthenticated: false, isProfileCompleted: false };
    }
}
exports.SplashController = SplashController;
