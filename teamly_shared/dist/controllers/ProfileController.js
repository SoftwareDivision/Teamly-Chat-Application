"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const apiService_1 = require("../services/apiService");
class ProfileController {
    static validateName(name) {
        if (!name || name.trim() === '') {
            return { isValid: false, errorMessage: 'Name is required' };
        }
        if (name.trim().length < 2) {
            return { isValid: false, errorMessage: 'Name must be at least 2 characters' };
        }
        return { isValid: true };
    }
    static validatePhone(phone) {
        if (!phone || phone.trim() === '') {
            return { isValid: false, errorMessage: 'Phone number is required' };
        }
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            return { isValid: false, errorMessage: 'Please enter a valid 10-digit phone number' };
        }
        return { isValid: true };
    }
    static async updateProfile(token, profileData) {
        try {
            const response = await apiService_1.ApiService.updateProfile(token, profileData.name, profileData.phone, profileData.profilePhoto);
            return { success: response.success, message: response.message, user: response.user };
        }
        catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }
}
exports.ProfileController = ProfileController;
