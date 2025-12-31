"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWithTokenRefresh = fetchWithTokenRefresh;
// API Interceptor for automatic token refresh
const authService_1 = require("../services/authService");
const apiService_1 = require("../services/apiService");
let isRefreshing = false;
let refreshSubscribers = [];
function subscribeTokenRefresh(callback) {
    refreshSubscribers.push(callback);
}
function onTokenRefreshed(token) {
    refreshSubscribers.forEach(callback => callback(token));
    refreshSubscribers = [];
}
async function fetchWithTokenRefresh(url, options = {}) {
    // Get current token
    let token = await authService_1.AuthService.getToken();
    // Add token to headers if available
    if (token && options.headers) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    // Make the request
    let response = await fetch(url, options);
    // If token expired (403), try to refresh
    if (response.status === 403) {
        const data = await response.json();
        if (data.message?.includes('expired') || data.message?.includes('Invalid')) {
            // If already refreshing, wait for it
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh(async (newToken) => {
                        // Retry with new token
                        if (options.headers) {
                            options.headers['Authorization'] = `Bearer ${newToken}`;
                        }
                        const retryResponse = await fetch(url, options);
                        resolve(retryResponse);
                    });
                });
            }
            // Start refreshing
            isRefreshing = true;
            try {
                const refreshToken = await authService_1.AuthService.getRefreshToken();
                if (!refreshToken) {
                    // No refresh token, logout
                    await authService_1.AuthService.logout();
                    throw new Error('Session expired. Please login again.');
                }
                // Refresh the token
                const refreshResponse = await apiService_1.ApiService.refreshToken(refreshToken);
                if (refreshResponse.success && refreshResponse.token) {
                    // Save new tokens
                    await authService_1.AuthService.saveToken(refreshResponse.token);
                    if (refreshResponse.refreshToken) {
                        await authService_1.AuthService.saveRefreshToken(refreshResponse.refreshToken);
                    }
                    // Notify all waiting requests
                    onTokenRefreshed(refreshResponse.token);
                    // Retry original request with new token
                    if (options.headers) {
                        options.headers['Authorization'] = `Bearer ${refreshResponse.token}`;
                    }
                    response = await fetch(url, options);
                }
                else {
                    // Refresh failed, logout
                    await authService_1.AuthService.logout();
                    throw new Error('Session expired. Please login again.');
                }
            }
            catch (error) {
                await authService_1.AuthService.logout();
                throw error;
            }
            finally {
                isRefreshing = false;
            }
        }
    }
    return response;
}
