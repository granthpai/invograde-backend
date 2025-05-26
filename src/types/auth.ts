export interface IEmailVerificationPayload {
  user: {
    email: string;
  };
  verificationCode: string;
}
