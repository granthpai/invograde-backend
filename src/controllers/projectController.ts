import { Request, Response } from "express";
import { Project } from "../models/project";
import mongoose from "mongoose";
import {
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
  validateS3Config,
} from "../utils/fileUpload";
import User from "../models/user";

export class ProjectController {
  constructor() {
    if (!validateS3Config()) {
      console.warn(
        "AWS S3 configuration is incomplete. File upload features may not work properly."
      );
    }
  }

  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        description,
        skills,
        tags,
        categories,
        projectUrl,
        githubUrl,
      } = req.body;

      if (
        !title ||
        !description ||
        !Array.isArray(skills) ||
        skills.length === 0 ||
        !Array.isArray(tags) ||
        tags.length === 0 ||
        !Array.isArray(categories) ||
        categories.length === 0
      ) {
        res.status(400).json({
          message:
            "Missing required fields: title, description, skills, tags, and categories.",
        });
        return;
      }

      const userId = req.user?.id as string;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      let thumbnailUrl = "";

      if (req.file) {
        try {
          const uploadResult = await uploadToS3(req.file, "project-thumbnails");
          thumbnailUrl = uploadResult.fileUrl;
        } catch (uploadError) {
          console.error("Failed to upload thumbnail:", uploadError);
          res.status(500).json({
            message: "Failed to upload thumbnail",
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "Unknown upload error",
          });
          return;
        }
      }

      const newProject = await Project.create({
        title,
        description,
        skills,
        tags,
        categories,
        userId,
        thumbnail: thumbnailUrl,
        projectUrl,
        githubUrl,
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { $push: { projects: newProject._id } },
        { new: true }
      );

      res.status(201).json({
        message: "Project created successfully",
        success: true,
        project: newProject,
      });
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({
        success: false,
        message: "Error creating project",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async uploadProjectThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id as string;

      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ message: "Valid project ID is required" });
        return;
      }

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      const project = await Project.findOne({ _id: projectId, userId });
      if (!project) {
        res.status(404).json({ message: "Project not found or unauthorized" });
        return;
      }

      if (project.thumbnail) {
        try {
          await deleteFromS3(project.thumbnail);
        } catch (error) {
          console.warn("Failed to delete old thumbnail:", error);
        }
      }

      const uploadResult = await uploadToS3(req.file, "project-thumbnails");

      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        {
          thumbnail: uploadResult.fileUrl,
        },
        { new: true }
      );

      res.status(200).json({
        message: "Thumbnail uploaded successfully",
        project: updatedProject,
        thumbnailUrl: uploadResult.fileUrl,
      });
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      res.status(500).json({
        message: "Error uploading thumbnail",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getPresignedUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileName, fileType } = req.body;
      const userId = req.user?.id as string;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!fileName || !fileType) {
        res.status(400).json({ message: "fileName and fileType are required" });
        return;
      }

      const result = await getPresignedUrl(
        fileName,
        fileType,
        "project-thumbnails"
      );

      res.status(200).json({
        message: "Presigned URL generated successfully",
        presignedUrl: result.presignedUrl,
        fileKey: result.fileKey,
        expiresIn: 900, // 15 minutes
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({
        message: "Error generating presigned URL",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getUserProjects(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const projects = await Project.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalProjects = await Project.countDocuments({ userId });
      const totalPages = Math.ceil(totalProjects / limit);

      res.status(200).json({
        success: true,
        message: "Projects retrieved successfully",
        projects,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalProjects,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      console.error("Error retrieving projects:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving projects",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id as string;

      if (!projectId) {
        res.status(400).json({ message: "Project ID is required" });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ message: "Invalid project ID" });
        return;
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        res.status(400).json({ message: "No update data provided" });
        return;
      }

      const allowedFields = [
        "title",
        "description",
        "skills",
        "domain",
        "tags",
        "isPublic",
        "projectUrl",
        "githubUrl",
      ];
      const invalidFields = Object.keys(updateData).filter(
        (field) => !allowedFields.includes(field)
      );

      if (invalidFields.length > 0) {
        res.status(400).json({
          message: "Invalid fields provided",
          invalidFields,
          allowedFields,
        });
        return;
      }

      if (updateData.skills) {
        if (!Array.isArray(updateData.skills)) {
          res.status(400).json({
            message: "Skills must be an array",
          });
          return;
        }
        if (
          !updateData.skills.every(
            (skill: { name: string }) =>
              typeof skill === "object" &&
              "name" in skill &&
              typeof skill.name === "string"
          )
        ) {
          res.status(400).json({
            message:
              "Invalid skills format. Each skill must be an object with a name property",
          });
          return;
        }
      }

      const project = await Project.findOneAndUpdate(
        { _id: projectId, userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!project) {
        res.status(404).json({ message: "Project not found or unauthorized" });
        return;
      }

      res.status(200).json({
        message: "Project updated successfully",
        project,
      });
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({
        message: "Error updating project",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id as string;

      if (!projectId) {
        res.status(400).json({ message: "Project ID is required" });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ message: "Invalid project ID" });
        return;
      }

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const project = await Project.findOneAndDelete({
        _id: projectId,
        userId,
      });

      if (!project) {
        res.status(404).json({ message: "Project not found or unauthorized" });
        return;
      }

      if (project.thumbnail) {
        try {
          await deleteFromS3(project.thumbnail);
        } catch (error) {
          console.warn("Failed to delete thumbnail from S3:", error);
        }
      }

      res.status(200).json({
        message: "Project deleted successfully",
        project,
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({
        message: "Error deleting project",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async toggleProjectLike(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id as string;

      if (!projectId) {
        res.status(400).json({ message: "Project ID is required" });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ message: "Invalid project ID" });
        return;
      }

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }

      const alreadyLiked = project.likesBy?.includes(userId);

      const update = alreadyLiked
        ? {
            $inc: { likes: -1 },
            $pull: { likesBy: userId },
          }
        : {
            $inc: { likes: 1 },
            $addToSet: { likesBy: userId },
          };

      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        update,
        {
          new: true,
        }
      );

      if (!updatedProject) {
        res.status(404).json({ message: "Project not found after update" });
        return;
      }

      res.status(200).json({
        message: alreadyLiked
          ? "Project unliked successfully"
          : "Project liked successfully",
        liked: !alreadyLiked,
        likes: updatedProject.likes,
        project: updatedProject,
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({
        message: "Error toggling project like",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getAllProjects(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const domain = req.query.domain as string;
      const search = req.query.search as string;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";

      let query: any = {};

      if (domain) {
        query.domain = domain;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      const sortObject: any = {};
      sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;

      const projects = await Project.find(query)
        .populate("userId", "username email")
        .sort(sortObject)
        .skip(skip)
        .limit(limit);

      const totalProjects = await Project.countDocuments(query);
      const totalPages = Math.ceil(totalProjects / limit);

      res.status(200).json({
        message: "Projects retrieved successfully",
        projects,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalProjects,
          itemsPerPage: limit,
        },
        filters: {
          domain,
          search,
          sortBy,
          sortOrder,
        },
      });
    } catch (error) {
      console.error("Error retrieving projects:", error);
      res.status(500).json({
        message: "Error retrieving projects",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ message: "Valid project ID is required" });
        return;
      }

      const project = await Project.findById(projectId).populate(
        "userId",
        "username email careerType"
      );

      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }

      const userId = req.user?._id as string;
      // if (project.userId.toString() !== userId) {
      //   res.status(403).json({ message: "Access denied to private project" });
      //   return;
      // }

      res.status(200).json({
        message: "Project retrieved successfully",
        project,
        success: true,
      });
    } catch (error) {
      console.error("Error retrieving project:", error);
      res.status(500).json({
        message: "Error retrieving project",
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      });
    }
  }
}

export const projectController = new ProjectController();
