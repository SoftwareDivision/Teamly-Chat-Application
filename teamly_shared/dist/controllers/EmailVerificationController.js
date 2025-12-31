"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationController = void 0;
const apiService_1 = require("../services/apiService");
// Controller for Email Verification logic
class EmailVerificationController {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    // Validate email and return detailed error message
    static validateEmailWithMessage(email) {
        // Check if email is empty
        if (!email || email.trim() === '') {
            return {
                isValid: false,
                errorMessage: 'Email address is required'
            };
        }
        // Check if email has spaces
        if (email.includes(' ')) {
            return {
                isValid: false,
                errorMessage: 'Email address cannot contain spaces'
            };
        }
        // Check if email has @ symbol
        if (!email.includes('@')) {
            return {
                isValid: false,
                errorMessage: 'Email must contain @ symbol'
            };
        }
        // Check if email has domain (after @)
        const parts = email.split('@');
        if (parts.length !== 2 || parts[1].trim() === '') {
            return {
                isValid: false,
                errorMessage: 'Please enter a complete email address'
            };
        }
        // Check if domain has extension (.com, .in, etc.)
        if (!parts[1].includes('.')) {
            return {
                isValid: false,
                errorMessage: 'Email must include domain extension (e.g., .com, .in)'
            };
        }
        // Check overall format using regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                isValid: false,
                errorMessage: 'Please enter a valid email address'
            };
        }
        // All checks passed
        return { isValid: true };
    }
    static async sendVerificationCode(email) {
        try {
            const response = await apiService_1.ApiService.sendOTP(email);
            return response.success;
        }
        catch (error) {
            console.error('Send verification code error:', error);
            throw error;
        }
    }
    static async verifyCode(code, email) {
        try {
            const response = await apiService_1.ApiService.verifyOTP(email, code);
            return {
                success: response.success,
                token: response.token,
                refreshToken: response.refreshToken,
                user: response.user,
            };
        }
        catch (error) {
            console.error('Verify code error:', error);
            throw error;
        }
    }
    static validateOTP(otp, expectedLength) {
        return otp.length === expectedLength && /^\d+$/.test(otp);
    }
}
exports.EmailVerificationController = EmailVerificationController;
