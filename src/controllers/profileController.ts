import { Profile } from "../models/profile";
import path from "path";
import fs from "fs/promises";
import { Request, Response } from "express";

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
      const user = await Profile.findById(req.user.id).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
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
      if (typeof isStudent === "boolean") updateData["isStudent"] = isStudent;

      const user = await Profile.findByIdAndUpdate(req.user.id, updateData, {
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

      const resumeData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadDate: new Date(),
      };

      const user = await Profile.findByIdAndUpdate(
        req.user.id,
        { resume: resumeData },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

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
        message: "Server error",
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

      const user = await Profile.findByIdAndUpdate(
        req.user.id,
        { profilePicture: req.file.filename },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully",
        data: {
          profilePicture: user.profilePicture,
        },
      });
    } catch (error) {
      console.error("Upload profile picture error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
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
      const { name, level } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Skill name is required",
        });
      }

      const user = await Profile.findById(req.user.id);

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

      user.skills.push({ name, level: level || "Beginner" });
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

      const user = await Profile.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const skill = user?.skills.id(skillId);

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      if (name) skill.name = name;
      if (yearsOfExperience) skill.yearsOfExperience = yearsOfExperience;

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

      const user = await Profile.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.skills.pull(skillId);
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
      const { degree, institution, year, grade } = req.body;

      if (!degree || !institution || !year) {
        return res.status(400).json({
          success: false,
          message: "Degree, institution, and year are required",
        });
      }

      const user = await Profile.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.education.push({ degree, institution, year, grade });
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

  async addWorkExperience(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      const { jobTitle, company, duration, description, isCurrentJob } =
        req.body;

      if (!jobTitle || !company || !duration) {
        return res.status(400).json({
          success: false,
          message: "Job title, company, and duration are required",
        });
      }

      const user = await Profile.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.workExperience.push({
        jobTitle,
        company,
        duration,
        description,
        isCurrentJob: isCurrentJob || false,
      });
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
        issuedBy,
        issueDate,
        expiryDate,
        credentialId,
        credentialUrl,
      } = req.body;

      if (!name || !issuedBy || !issueDate) {
        return res.status(400).json({
          success: false,
          message: "Name, issued by, and issue date are required",
        });
      }

      const user = await Profile.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.certifications.push({
        name,
        issuedBy,
        issueDate,
        expiryDate,
        credentialId,
        credentialUrl,
      });
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

  async deleteResume(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Login Again",
        });
      }
      const user = await Profile.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.resume && user.resume.filename) {
        try {
          await fs.unlink(path.join("uploads/resumes/", user.resume.filename));
        } catch (fileError) {
          console.error("Error deleting resume file:", fileError);
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
        message: "Server error",
      });
    }
  }
}

export default new ProfileController();
