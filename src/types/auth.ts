// types/auth.ts
export interface IEmailVerificationPayload {
  user: {
    email: string;
  };
  verificationCode: string;
}
