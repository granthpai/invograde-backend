import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendVerificationSMS = async (
  to: string,
  verificationCode: string
) => {
  try {
    await client.messages.create({
      body: `Your Invograde verification code is: ${verificationCode}. This code will expire in 60 seconds.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send verification SMS');
  }
};