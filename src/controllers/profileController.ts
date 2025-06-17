import { Request, Response } from "express";
import User from "../models/user";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import mongoose from "mongoose";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "your-bucket-name";

interface ValidationError extends Error {
  errors: Record<string, { message: string }>;
}

export class ProfileController {
  async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }

      const user = await User.findById(req.user._id).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found, Login again!",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }

      const { fullName, specialization, gender, isStudent } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          username: fullName,
          careerType: specialization,
          gender,
          isStudent,
        },
        {
          new: true,
        }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error: unknown) {
      console.error("Update profile error:", error);

      if (error instanceof Error && error.name === "ValidationError") {
        const validationError = error as ValidationError;
        const errors = Object.values(validationError.errors).map((err) => {
          if (err && typeof err === "object" && "message" in err) {
            return err.message;
          }
          return String(err);
        });
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  private async uploadToS3(
    file: Express.Multer.File,
    folder: string
  ): Promise<{ key: string; url: string }> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const key = `${folder}/${fileName}`;

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await s3.upload(uploadParams).promise();

    return {
      key: key,
      url: result.Location,
    };
  }

  private async deleteFromS3(key: string): Promise<void> {
    const deleteParams: AWS.S3.DeleteObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(deleteParams).promise();
  }

  async uploadResume(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No resume file provided",
        });
      }

      const allowedMimeTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only PDF, DOC, and DOCX files are allowed for resume",
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Resume file size cannot exceed 5MB",
        });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.resume && user.resume.s3Key) {
        try {
          await this.deleteFromS3(user.resume.s3Key);
        } catch (deleteError) {
          console.error("Error deleting old resume from S3:", deleteError);
        }
      }

      const { key, url } = await this.uploadToS3(req.file, "resumes");

      const resumeData = {
        filename: req.file.originalname,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadDate: new Date(),
        s3Key: key,
        s3Url: url,
      };

      user.resume = resumeData;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Resume uploaded successfully",
        data: {
          resume: user.resume,
        },
      });
    } catch (error) {
      console.error("Upload resume error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while uploading resume",
      });
    }
  }

  async uploadProfilePicture(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No profile picture provided",
        });
      }

      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPEG, PNG, GIF, and WebP images are allowed",
        });
      }

      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Profile picture size cannot exceed 2MB",
        });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.profilePicture) {
        try {
          await this.deleteFromS3(user.profilePicture);
        } catch (deleteError) {
          console.error(
            "Error deleting old profile picture from S3:",
            deleteError
          );
        }
      }

      const { key, url } = await this.uploadToS3(req.file, "profile-pictures");

      user.profilePicture = url;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully",
        data: {
          profilePicture: user.profilePicture,
          profilePictureUrl: user.profilePicture,
        },
      });
    } catch (error) {
      console.error("Upload profile picture error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while uploading profile picture",
      });
    }
  }
  async updateResumeSections(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Please login again",
        });
      }

      let { skills, education, workExperience, certifications } = req.body;

      if (skills && !Array.isArray(skills)) {
        return res
          .status(400)
          .json({ success: false, message: "Skills must be an array" });
      }
      if (education && !Array.isArray(education)) {
        return res
          .status(400)
          .json({ success: false, message: "Education must be an array" });
      }
      if (workExperience && !Array.isArray(workExperience)) {
        return res.status(400).json({
          success: false,
          message: "Work experience must be an array",
        });
      }
      if (certifications && !Array.isArray(certifications)) {
        return res
          .status(400)
          .json({ success: false, message: "Certifications must be an array" });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (skills) {
        user.skills = skills.map((skill: any) => ({
          name: skill.name,
          yearsOfExperience: skill.yearsOfExperience,
        }));
      }

      if (education) {
        user.education = education.map((edu: any) => ({
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
        }));
      }

      if (workExperience) {
        user.workExperience = workExperience.map((work: any) => ({
          jobTitle: work.jobTitle,
          company: work.company,
        }));
      }

      if (certifications) {
        user.certifications = certifications.map((cert: any) => ({
          name: cert.name,
          expiryMonth: cert.expiryMonth,
          expiryYear: cert.expiryYear,
          doesNotExpire: Boolean(cert.doesNotExpire),
        }));
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: "Resume sections updated successfully",
        data: {
          skills: user.skills,
          education: user.education,
          workExperience: user.workExperience,
          certifications: user.certifications,
        },
      });
    } catch (error) {
      console.error("Update Resume Error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating resume sections",
      });
    }
  }

  async getResumeData(req: Request, res: Response) {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await User.findById(userId).select(
        "skills education workExperience certifications"
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        skills: user.skills || [],
        education: user.education || [],
        workExperience: user.workExperience || [],
        certifications: user.certifications || [],
      });
    } catch (err) {
      console.error("Error fetching resume data:", err);
      res.status(500).json({ message: "Server error" });
    }
  }

  async deleteResume(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.resume) {
        return res.status(404).json({
          success: false,
          message: "No resume found to delete",
        });
      }

      if (user.resume.s3Key) {
        try {
          await this.deleteFromS3(user.resume.s3Key);
        } catch (deleteError) {
          console.error("Error deleting resume from S3:", deleteError);
        }
      }

      user.resume = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Resume deleted successfully",
      });
    } catch (error) {
      console.error("Delete resume error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting resume",
      });
    }
  }

  async deleteProfilePicture(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.profilePicture) {
        return res.status(404).json({
          success: false,
          message: "No profile picture found to delete",
        });
      }

      try {
        await this.deleteFromS3(user.profilePicture);
      } catch (deleteError) {
        console.error("Error deleting profile picture from S3:", deleteError);
      }

      user.profilePicture = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile picture deleted successfully",
      });
    } catch (error) {
      console.error("Delete profile picture error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting profile picture",
      });
    }
  }
}

export const profileController = new ProfileController();
