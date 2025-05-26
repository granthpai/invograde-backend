import { Request, response, Response } from "express";
import { validationResult } from "express-validator";
import User, { IUser } from "../models/user";
import { IVerificationCode } from "../models/verificationCode";
import VerificationCode from "../models/verificationCode";
import { sendVerificationEmail, sendPasswordResetEmail } from "../config/email";
import { sendVerificationSMS } from "../config/sms";
import { generateNumCode } from "../utils/generateVerificationCode";
class AuthController {
  async checkExists(req: Request, res: Response): Promise<void> {
    try {
      const { emailOrPhone } = req.body;
      const isEmail = emailOrPhone.includes("@");
      const query = isEmail
        ? { email: emailOrPhone }
        : { phoneNumber: emailOrPhone };

      const user = await User.findOne(query);

      res.status(200).json({
        success: true,
        exists: !user,
        message: user
          ? "User already exists. Please log in."
          : "User does not exist. Please continue with registration.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: (error as Error).message,
      });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { emailOrPhone, password, username, career } = req.body;
      const isEmail = emailOrPhone.includes("@");
      let userData;

      if (isEmail) {
        const existingUser = await User.findOne({ email: emailOrPhone });
        if (existingUser) {
          res.status(400).json({
            success: false,
            message: "User already exists with this email",
          });
          return;
        }

        const verificationCode = generateNumCode();

        const resp = await sendVerificationEmail({
          user: { email: emailOrPhone },
          verificationCode,
        });

        userData = {
          email: emailOrPhone,
          password,
          isEmailVerified: false,
          isPhoneVerified: false,
          careerType: career,
          username,
        };

        const verificationCodeInstance = await VerificationCode.create({
          tempUserData: userData,
          code: verificationCode,
          type: "email",
        });
        console.log("verificationCodeInstance", verificationCodeInstance);
        const { password: _, ...safeUserData } = userData;

        res.status(201).json({
          success: true,
          userData: safeUserData,
          verificationType: isEmail ? "email" : "phone",
          message: `Verification code sent to your ${
            isEmail ? "email" : "phone"
          }`,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Phone registration not implemented yet",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: (error as Error).message,
      });
    }
  }

  async verifyContact(req: Request, res: Response): Promise<void> {
    try {
      const { user, code } = req.body;
      const verificationRecord = await VerificationCode.findOne({
        code,
        "tempUserData.email": user.email,
      });

      if (!verificationRecord) {
        res
          .status(400)
          .json({ success: false, message: "Invalid verification code" });
        return;
      }

      if (verificationRecord.expiresAt < new Date()) {
        await VerificationCode.deleteOne({ _id: verificationRecord._id });
        res
          .status(400)
          .json({ success: false, message: "Verification code has expired" });
        return;
      }

      const tempUserData = verificationRecord.tempUserData;

      if (!tempUserData) {
        res.status(400).json({
          success: false,
          message: "Temporary user data not found",
        });
        return;
      }

      const existingUser = await User.findOne({
        $or: [
          { email: tempUserData.email },
        ],
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "User already exists",
        });
        return;
      }

      const newUser = await User.create({
        email: tempUserData.email,
        phoneNumber: tempUserData.phoneNumber,
        password: tempUserData.password,
        username: tempUserData.username,
        careerType: tempUserData.careerType,
        isEmailVerified: verificationRecord.type === "email",
        isPhoneVerified: verificationRecord.type === "phone",
      });

      await VerificationCode.deleteOne({ _id: verificationRecord._id });

      res.status(200).json({
        success: true,
        newUser,
        message: `${
          verificationRecord.type === "email" ? "Email" : "Phone"
        } verified successfully`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: (error as Error).message,
      });
    }
  }

  async resendVerificationCode(req: Request, res: Response): Promise<void> {
    try {
      const { userId, type } = req.body;
      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      await VerificationCode.deleteMany({ user: userId, type });

      const verificationCode = generateNumCode();
      await VerificationCode.create({
        user: user._id,
        code: verificationCode,
        type,
      });

      if (type === "email") {
        if (!user.email) {
          res.status(400).json({
            success: false,
            message: "User does not have an email address",
          });
          return;
        }
        await sendVerificationEmail({
          user: { email: user.email },
          verificationCode,
        });
      } else if (type === "phone") {
        if (!user.phoneNumber) {
          res.status(400).json({
            success: false,
            message: "User does not have a phone number",
          });
          return;
        }
        await sendVerificationSMS(user.phoneNumber, verificationCode);
      }

      res.status(200).json({
        success: true,
        message: `Verification code resent to your ${
          type === "email" ? "email" : "phone"
        }`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: (error as Error).message,
      });
    }
  }

  async completeProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId, username, careerType, receiveUpdates } = req.body;
      const existingUsername = (await User.findOne({ username }).exec()) as
        | (IUser & { _id: any })
        | null;

      if (existingUsername && existingUsername._id.toString() !== userId) {
        res
          .status(400)
          .json({ success: false, message: "Username already taken" });
        return;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { username, careerType, receiveUpdates: receiveUpdates || false },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      const token = user.getSignedJwtToken();
      res.status(200).json({
        success: true,
        message: "Profile completed successfully",
        token,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: (error as Error).message,
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { emailOrPhone, password } = req.body;

      const sanitizedInput = emailOrPhone.trim().toLowerCase();

      let query: any;

      if (sanitizedInput.includes("@")) {
        query = { email: sanitizedInput };
      } else if (/^\+?[\d\s\-\(\)]+$/.test(emailOrPhone)) {
        query = { phoneNumber: emailOrPhone };
      } else {
        query = { username: emailOrPhone };
      }

      const user = await User.findOne(query).select("-password");
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
        return;
      }

      console.log("user without pass", user);

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: "Incorrect password",
        });
        return;
      }

      if (!user.username || !user.careerType) {
        res.status(400).json({
          success: false,
          message: "Please complete your profile",
          userId: user._id,
        });
        return;
      }

      const token = user.getSignedJwtToken();
      res.status(200).json({
        success: true,
        token,
        user,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: (error as Error).message,
      });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user!._id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: (error as Error).message,
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "No account found with this email",
        });
        return;
      }

      const resetToken = generateNumCode();
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000);
      await user.save();

      await sendPasswordResetEmail(email, resetToken);

      res.status(200).json({
        success: true,
        message: "Password reset instructions sent to your email",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while processing your request",
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        res.status(400).json({
          success: false,
          message: "Password reset token is invalid or has expired",
        });
        return;
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Your password has been updated successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while resetting your password",
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie("token");
      res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while logging out",
      });
    }
  }
}

export default new AuthController();
