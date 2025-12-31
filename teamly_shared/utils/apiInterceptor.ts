// API Interceptor for automatic token refresh
import { AuthService } from '../services/authService';
import { ApiService } from '../services/apiService';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

export async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get current token
  let token = await AuthService.getToken();
  
  // Add token to headers if available
  if (token && options.headers) {
    (options.headers as any)['Authorization'] = `Bearer ${token}`;
  }

  // Make the request
  let response = await fetch(url, options);

  // If token expired (403), try to refresh
  if (response.status === 403) {
    const data = await response.json() as { message?: string };
    
    if (data.message?.includes('expired') || data.message?.includes('Invalid')) {
      // If already refreshing, wait for it
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(async (newToken: string) => {
            // Retry with new token
            if (options.headers) {
              (options.headers as any)['Authorization'] = `Bearer ${newToken}`;
            }
            const retryResponse = await fetch(url, options);
            resolve(retryResponse);
          });
        });
      }

      // Start refreshing
      isRefreshing = true;

      try {
        const refreshToken = await AuthService.getRefreshToken();
        
        if (!refreshToken) {
          // No refresh token, logout
          await AuthService.logout();
          throw new Error('Session expired. Please login again.');
        }

        // Refresh the token
        const refreshResponse = await ApiService.refreshToken(refreshToken);

        if (refreshResponse.success && refreshResponse.token) {
          // Save new tokens
          await AuthService.saveToken(refreshResponse.token);
          if (refreshResponse.refreshToken) {
            await AuthService.saveRefreshToken(refreshResponse.refreshToken);
          }

          // Notify all waiting requests
          onTokenRefreshed(refreshResponse.token);

          // Retry original request with new token
          if (options.headers) {
            (options.headers as any)['Authorization'] = `Bearer ${refreshResponse.token}`;
          }
          response = await fetch(url, options);
        } else {
          // Refresh failed, logout
          await AuthService.logout();
          throw new Error('Session expired. Please login again.');
        }
      } catch (error) {
        await AuthService.logout();
        throw error;
      } finally {
        isRefreshing = false;
      }
    }
  }

  return response;
}
