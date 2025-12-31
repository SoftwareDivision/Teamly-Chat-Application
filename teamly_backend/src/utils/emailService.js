const nodemailer = require('nodemailer');
const admin = require('../config/firebase');

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOTPEmail = async (email, otpCode) => {
  try {
    // Create or get user in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email: email,
          emailVerified: false,
        });
        console.log('New Firebase user created:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Send OTP email via Gmail
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Teamly Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4A90E2; text-align: center; letter-spacing: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Teamly</h1>
            </div>
            <div class="content">
              <h2>Email Verification</h2>
              <p>Hello,</p>
              <p>Your verification code is:</p>
              <div class="otp-code">${otpCode}</div>
              <p>This code will expire in 5 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Teamly. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your Teamly verification code is: ${otpCode}. This code will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);

    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

module.exports = { sendOTPEmail };
