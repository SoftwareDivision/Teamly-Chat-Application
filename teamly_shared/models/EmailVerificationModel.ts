// Model for Email Verification data
export interface EmailVerificationModel {
  email: string;
  otpLength: number;
}

export const emailData: EmailVerificationModel = {
  email: '',
  otpLength: 6,
};
