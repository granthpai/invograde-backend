import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (
  to: string,
  verificationCode: string
) => {
  try {
    await transporter.sendMail({
      from: `"Invograde" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Invograde!</h2>
          <p>Please use the following verification code to complete your registration:</p>
          <h3 style="letter-spacing: 5px; text-align: center; font-size: 24px;">${verificationCode}</h3>
          <p>This code will expire in 60 seconds.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <p>Thanks,<br>The Invograde Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};

export default transporter;