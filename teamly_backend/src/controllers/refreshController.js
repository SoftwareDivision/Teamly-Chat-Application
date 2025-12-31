const jwt = require('jsonwebtoken');

class RefreshController {
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Verify refresh token
      jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: 'Invalid or expired refresh token'
          });
        }

        // Check if it's actually a refresh token
        if (decoded.type !== 'refresh') {
          return res.status(403).json({
            success: false,
            message: 'Invalid token type'
          });
        }

        // Generate new access token (1 hour)
        const newAccessToken = jwt.sign(
          { userId: decoded.userId, email: decoded.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Optionally generate new refresh token (30 days) for rotation
        const newRefreshToken = jwt.sign(
          { userId: decoded.userId, email: decoded.email, type: 'refresh' },
          process.env.JWT_SECRET,
          { expiresIn: '30d' }
        );

        res.status(200).json({
          success: true,
          token: newAccessToken,
          refreshToken: newRefreshToken
        });
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token'
      });
    }
  }
}

module.exports = RefreshController;
