import { Request, Response } from "express";
import User from "../models/user";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import mongoose from "mongoose";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'your-bucket-name';

interface ValidationError extends Error {
  errors: Record<string, { message: string }>;
}

class ProfileController {
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

      const updateData: { [key: string]: any } = {};
      if (fullName) updateData["fullName"] = fullName;
      if (specialization) updateData["specialization"] = specialization;
      if (gender) updateData["gender"] = gender;
      if (typeof isStudent === "boolean" || typeof isStudent === "string") {
        updateData["isStudent"] = isStudent;
      }

      const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

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

  private async uploadToS3(file: Express.Multer.File, folder: string): Promise<{ key: string; url: string }> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const key = `${folder}/${fileName}`;

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await s3.upload(uploadParams).promise();
    
    return {
      key: key,
      url: result.Location
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
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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

      const { key, url } = await this.uploadToS3(req.file, 'resumes');

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
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
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
          console.error("Error deleting old profile picture from S3:", deleteError);
        }
      }

      const { key, url } = await this.uploadToS3(req.file, 'profile-pictures');

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

  async addSkill(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { name, yearsOfExperience } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Skill name is required",
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const existingSkill = user.skills.find(
        (skill) => skill.name.toLowerCase() === name.toLowerCase()
      );

      if (existingSkill) {
        return res.status(400).json({
          success: false,
          message: "Skill already exists",
        });
      }

      const newSkill = {
        _id: new mongoose.Types.ObjectId(),
        name,
        yearsOfExperience: yearsOfExperience || 0
      };
      
      user.skills.push(newSkill);
      await user.save();

      res.status(201).json({
        success: true,
        message: "Skill added successfully",
        data: user.skills,
      });
    } catch (error) {
      console.error("Add skill error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async updateSkill(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { skillId } = req.params;
      const { name, yearsOfExperience } = req.body;

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const skill = user.skills.find(skill => skill._id.toString() === skillId);

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      if (name) skill.name = name;
      if (yearsOfExperience !== undefined) skill.yearsOfExperience = yearsOfExperience;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Skill updated successfully",
        data: user.skills,
      });
    } catch (error) {
      console.error("Update skill error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async deleteSkill(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { skillId } = req.params;

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.skills = user.skills.filter(skill => skill._id.toString() !== skillId);
      await user.save();

      res.status(200).json({
        success: true,
        message: "Skill deleted successfully",
        data: user.skills,
      });
    } catch (error) {
      console.error("Delete skill error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async addEducation(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { degree, fieldOfStudy, institution, year, grade } = req.body;

      if (!degree || !institution) {
        return res.status(400).json({
          success: false,
          message: "Degree and institution are required",
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const newEducation = {
        _id: new mongoose.Types.ObjectId(),
        degree,
        fieldOfStudy,
        institution,
        startDate: year ? new Date(year, 0, 1) : new Date(),
        current: true,
        year,
        grade
      };

      user.education.push(newEducation);
      await user.save();

      res.status(201).json({
        success: true,
        message: "Education added successfully",
        data: user.education,
      });
    } catch (error) {
      console.error("Add education error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async updateEducation(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { educationId } = req.params;
      const { degree, fieldOfStudy, institution, year, grade } = req.body;

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const education = user.education.find(ed => ed._id.toString() === educationId);

      if (!education) {
        return res.status(404).json({
          success: false,
          message: "Education record not found",
        });
      }

      if (degree) education.degree = degree;
      if (fieldOfStudy) education.fieldOfStudy = fieldOfStudy;
      if (institution) education.institution = institution;
      if (year) {
        education.year = year;
        education.startDate = new Date(year, 0, 1);
      }
      if (grade) education.grade = grade;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Education updated successfully",
        data: user.education,
      });
    } catch (error) {
      console.error("Update education error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async deleteEducation(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { educationId } = req.params;

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.education = user.education.filter(education => education._id.toString() !== educationId.toString());
      await user.save();

      res.status(200).json({
        success: true,
        message: "Education deleted successfully",
        data: user.education,
      });
    } catch (error) {
      console.error("Delete education error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async addWorkExperience(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { jobTitle, company, duration, description, isCurrentJob } = req.body;

      if (!jobTitle || !company) {
        return res.status(400).json({
          success: false,
          message: "Job title and company are required",
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const newWorkExperience = {
        company,
        position: jobTitle,
        startDate: new Date(),
        endDate: isCurrentJob ? undefined : new Date(),
        current: isCurrentJob || false,
        description,
      };

      user.workExperience.push(newWorkExperience);
      await user.save();

      res.status(201).json({
        success: true,
        message: "Work experience added successfully",
        data: user.workExperience,
      });
    } catch (error) {
      console.error("Add work experience error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async updateWorkExperience(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { workExperienceId } = req.params;
      const { jobTitle, company, duration, description, isCurrentJob } = req.body;

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const workExperience = user.workExperience.find(exp => exp._id?.toString() === workExperienceId);

      if (!workExperience) {
        return res.status(404).json({
          success: false,
          message: "Work experience not found",
        });
      }

      if (jobTitle) workExperience.position = jobTitle;
      if (company) workExperience.company = company;
      if (description) workExperience.description = description;
      if (typeof isCurrentJob === 'boolean') workExperience.current = isCurrentJob;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Work experience updated successfully",
        data: user.workExperience,
      });
    } catch (error) {
      console.error("Update work experience error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async deleteWorkExperience(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { workExperienceId } = req.params;

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { workExperience: { _id: workExperienceId } } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Work experience deleted successfully",
        data: updatedUser.workExperience,
      });
    } catch (error) {
      console.error("Delete work experience error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async addCertification(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const {
        name,
        issuingOrganization,
        issueDate,
        expiryDate,
        credentialId,
        credentialUrl,
        hasExpiry
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Certification name is required",
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const existingCertification = user.certifications?.find(
        (cert) => cert.name.toLowerCase() === name.toLowerCase() && 
                  cert.issuingOrganization?.toLowerCase() === issuingOrganization?.toLowerCase()
      );

      if (existingCertification) {
        return res.status(400).json({
          success: false,
          message: "Certification already exists",
        });
      }

      if (!user.certifications) {
        user.certifications = [];
      }

      const newCertification = {
        name,
        issuingOrganization,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expirationDate: expiryDate ? new Date(expiryDate) : undefined,
        certificateUrl: credentialUrl,
      };

      user.certifications.push(newCertification);
      await user.save();

      res.status(201).json({
        success: true,
        message: "Certification added successfully",
        data: user.certifications,
      });
    } catch (error) {
      console.error("Add certification error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async updateCertification(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { certificationId } = req.params;
      const {
        name,
        issuingOrganization,
        issueDate,
        expiryDate,
        credentialId,
        credentialUrl,
        hasExpiry
      } = req.body;

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const certification = user.certifications?.find(cert => cert._id?.toString() === certificationId);

      if (!certification) {
        return res.status(404).json({
          success: false,
          message: "Certification not found",
        });
      }

      if (name) certification.name = name;
      if (issuingOrganization) certification.issuingOrganization = issuingOrganization;
      if (issueDate) certification.issueDate = new Date(issueDate);
      if (expiryDate) certification.expirationDate = new Date(expiryDate);
      if (credentialUrl) certification.certificateUrl = credentialUrl;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Certification updated successfully",
        data: user.certifications,
      });
    } catch (error) {
      console.error("Update certification error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async deleteCertification(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      
      const { certificationId } = req.params;

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.certifications) {
        return res.status(404).json({
          success: false,
          message: "No certifications found",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { certifications: { _id: certificationId } } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Certification deleted successfully",
        data: updatedUser?.certifications || [],
      });
    } catch (error) {
      console.error("Delete certification error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
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

export default ProfileController;