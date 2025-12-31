const User = require('../models/User');

class ProfileController {
  static async updateProfile(req, res) {
    try {
      const { name, phone, profilePhoto } = req.body;
      const userId = req.user.userId; // From JWT token

      console.log('Profile update request received');
      console.log('User ID:', userId);
      console.log('Name:', name);
      console.log('Phone:', phone);
      console.log('Has photo:', !!profilePhoto);
      if (profilePhoto) {
        console.log('Photo length:', profilePhoto.length);
      }

      // Validate required fields
      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Name and phone are required',
        });
      }

      // Validate name
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long',
        });
      }

      // Validate phone (10 digits)
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be 10 digits',
        });
      }

      // Remove base64 prefix if present
      let cleanProfilePhoto = null;
      if (profilePhoto) {
        // Remove "data:image/jpeg;base64," or similar prefix
        cleanProfilePhoto = profilePhoto.replace(/^data:image\/[a-z]+;base64,/, '');
      }

      // Update user profile
      const updatedUser = await User.updateProfile(
        userId,
        name.trim(),
        cleanPhone,
        cleanProfilePhoto
      );

      console.log('Profile updated in database');
      console.log('Updated user:', {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        hasPhoto: !!updatedUser.profile_photo,
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.username,
          phone: updatedUser.phone,
          profilePhoto: updatedUser.profile_photo
            ? `data:image/jpeg;base64,${updatedUser.profile_photo}`
            : null,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile. Please try again.',
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const userId = req.user.userId; // From JWT token

      const user = await User.getProfile(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.username,
          phone: user.phone,
          profilePhoto: user.profile_photo
            ? `data:image/jpeg;base64,${user.profile_photo}`
            : null,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile. Please try again.',
      });
    }
  }
}

module.exports = ProfileController;
