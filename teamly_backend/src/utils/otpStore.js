// In-memory OTP storage with automatic expiration
class OTPStore {
  constructor() {
    this.otps = new Map(); // { email: { code, expiresAt } }
  }

  // Store OTP with 5-minute expiration
  set(email, code) {
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now
    this.otps.set(email, { code, expiresAt });

    // Auto-delete after 5 minutes
    setTimeout(() => {
      this.otps.delete(email);
    }, 5 * 60 * 1000);

    console.log(`OTP stored for ${email}, expires in 5 minutes`);
  }

  // Verify OTP
  verify(email, code) {
    const stored = this.otps.get(email);

    console.log(`Verifying OTP for ${email}`);
    console.log(`Stored OTP: ${stored ? stored.code : 'NOT FOUND'}`);
    console.log(`Received OTP: ${code}`);
    console.log(`Type of stored: ${stored ? typeof stored.code : 'N/A'}`);
    console.log(`Type of received: ${typeof code}`);

    if (!stored) {
      console.log('❌ No OTP found for this email');
      return false; // No OTP found
    }

    if (Date.now() > stored.expiresAt) {
      this.otps.delete(email); // Expired, remove it
      console.log('❌ OTP expired');
      return false;
    }

    // Convert both to strings for comparison
    const storedCodeStr = String(stored.code);
    const receivedCodeStr = String(code);

    if (storedCodeStr !== receivedCodeStr) {
      console.log(`❌ OTP mismatch: "${storedCodeStr}" !== "${receivedCodeStr}"`);
      return false; // Wrong code
    }

    // Valid OTP - keep it until it expires naturally
    console.log('✅ OTP verified successfully');
    return true;
  }

  // Check if OTP exists and is valid
  has(email) {
    const stored = this.otps.get(email);
    if (!stored) return false;
    
    if (Date.now() > stored.expiresAt) {
      this.otps.delete(email);
      return false;
    }
    
    return true;
  }

  // Get remaining time in seconds
  getRemainingTime(email) {
    const stored = this.otps.get(email);
    if (!stored) return 0;
    
    const remaining = Math.max(0, stored.expiresAt - Date.now());
    return Math.floor(remaining / 1000); // Convert to seconds
  }

  // Clear all OTPs (for testing)
  clear() {
    this.otps.clear();
  }
}

// Export singleton instance
module.exports = new OTPStore();
