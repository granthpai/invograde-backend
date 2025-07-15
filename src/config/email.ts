import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { IEmailVerificationPayload } from "../types/auth";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (
  payload: IEmailVerificationPayload
) => {
  const { user, verificationCode } = payload;

  if (!user.email) {
    throw new Error("User email is required to send verification email");
  }

  const { email } = user;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to Our App!</h2>
          <p style="font-size: 16px; color: #666;">Please use the following verification code to complete your registration:</p>
          <h3 style="letter-spacing: 5px; text-align: center; font-size: 24px; color: #4CAF50; margin: 20px 0;">${verificationCode}</h3>
          <p style="font-size: 16px; color: #666;">This code will expire in 60 seconds.</p>
          <p style="font-size: 16px; color: #666;">If you didn't request this verification, please ignore this email.</p>
          <p style="font-size: 16px; color: #666;">Thanks,<br>The Team</p>
        </div>
      `,
      text: `Welcome to Our App!
        
        Please use the following verification code to complete your registration:
        
        ${verificationCode}
        
        This code will expire in 60 seconds.
        
        If you didn't request this verification, please ignore this email.
        
        Thanks,
        The Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully!");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};


export const sendPasswordResetEmail = async (email: string, username: string, rawToken: string): Promise<void> => {
  try {
    const resetUrl = `https://www.invograde.com/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: `"Invograde Support" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Reset Your Password - Invograde',
      html: getPasswordResetEmailTemplate(username, resetUrl),
      text: getPasswordResetEmailText(username, resetUrl)
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

const getPasswordResetEmailTemplate = (username: string, resetUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        
        <p>Hi ${username},</p>
        
        <p>We received a request to reset your password for your Invograde account.</p>
        
        <p>Click the link below to reset your password:</p>
        
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        
        <div class="warning">
          <p><strong>This link is valid for the next 15 minutes.</strong></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
        
        <div class="footer">
          <p>Thanks,<br>The Invograde Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getPasswordResetEmailText = (username: string, resetUrl: string): string => {
  return `
Reset Your Password - Invograde

Hi ${username},

We received a request to reset your password for your Invograde account.

Click the link below to reset your password:
${resetUrl}

This link is valid for the next 15 minutes.

If you didn't request this, you can safely ignore this email.

Thanks,
The Invograde Team
  `;
};

export default transporter;
