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

export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string
) => {
  try {
    console.log("Sending password reset email to:", to);

    const mailOptions = {
      from: process.env.SMTP_USER || "youremail@gmail.com",
      to,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Password Reset</h2>
          <p style="font-size: 16px; color: #666;">Click the link below to reset your password:</p>
          <p style="font-size: 16px; color: #666; margin: 20px 0; text-align: center;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/reset-password/${resetToken}" 
               style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p style="font-size: 16px; color: #666;">This link will expire in 30 minutes.</p>
          <p style="font-size: 16px; color: #666;">If you didn't request this password reset, please ignore this email.</p>
          <p style="font-size: 16px; color: #666;">Thanks,<br>The Team</p>
        </div>
      `,
      text: `Password Reset Request
        
        Click the link below to reset your password:
        
        ${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/reset-password/${resetToken}
        
        This link will expire in 30 minutes.
        
        If you didn't request this password reset, please ignore this email.
        
        Thanks,
        The Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully!");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

export default transporter;
