import { Request, Response } from 'express';
import { Project } from '../models/project';
import mongoose from 'mongoose';

export class ProjectController {
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const { 
        title, 
        description, 
        skills, 
        domain, 
        tags, 
        thumbnail,
        likes,
        likesBy,
        projectUrl,
        githubUrl
      } = req.body;

      if (!title || !description || !skills || !Array.isArray(skills)) {
        res.status(400).json({ 
          message: 'Missing required fields: title, description, and skills are required' 
        });
        return;
      }

      const userId = req.user?.id as string;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!skills.every(skill => typeof skill === 'object' && 
        'name' in skill && typeof skill.name === 'string')) {
        res.status(400).json({ 
          message: 'Invalid skills format. Each skill must be an object with a name property' 
        });
        return;
      }

      const newProject = new Project({
        title,
        description,
        skills,
        domain,
        tags,
        userId,
        thumbnail,
        likes,
        likesBy,
        projectUrl,
        githubUrl
      });

      const savedProject = await newProject.save();

      res.status(201).json({
        message: 'Project created successfully',
        project: savedProject
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ 
        message: 'Error creating project', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async getUserProjects(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
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
        message: 'Projects retrieved successfully',
        projects,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalProjects,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Error retrieving projects:', error);
      res.status(500).json({ 
        message: 'Error retrieving projects', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id as string;

      if (!projectId) {
        res.status(400).json({ message: 'Project ID is required' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ message: 'Invalid project ID' });
        return;
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        res.status(400).json({ message: 'No update data provided' });
        return;
      }
      
      const allowedFields = ['title', 'description', 'skills', 'domain', 'tags', 'thumbnail', 'isPublic'];
      const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        res.status(400).json({ 
          message: 'Invalid fields provided',
          invalidFields
        });
        return;
      }

      if (updateData.skills) {
        if (!Array.isArray(updateData.skills)) {
          res.status(400).json({ 
            message: 'Skills must be an array'
          });
          return;
        }
        if (!updateData.skills.every((skill: { name: string }) => 
          typeof skill === 'object' && 'name' in skill && typeof skill.name === 'string')) {
          res.status(400).json({ 
            message: 'Invalid skills format. Each skill must be an object with a name property'
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
        res.status(404).json({ message: 'Project not found or unauthorized' });
        return;
      }

      res.status(200).json({
        message: 'Project updated successfully',
        project
      });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ 
        message: 'Error updating project', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id as string;

      if (!projectId) {
        res.status(400).json({ message: 'Project ID is required' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ message: 'Invalid project ID' });
        return;
      }

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const project = await Project.findOneAndDelete({ 
        _id: projectId, 
        userId 
      });

      if (!project) {
        res.status(404).json({ message: 'Project not found or unauthorized' });
        return;
      }

      res.status(200).json({
        message: 'Project deleted successfully',
        project
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ 
        message: 'Error deleting project', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async likeProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id as string;

      if (!projectId) {
        res.status(400).json({ message: 'Project ID is required' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ message: 'Invalid project ID' });
        return;
      }

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const existingProject = await Project.findById(projectId);
      if (!existingProject) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      if (existingProject.likesBy && existingProject.likesBy.includes(userId)) {
        res.status(400).json({ message: 'Project already liked by user' });
        return;
      }
      
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { 
          $inc: { likes: 1 },
          $addToSet: { likesBy: userId }
        },
        { new: true }
      );

      if (!updatedProject) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      res.status(200).json({
        message: 'Project liked successfully',
        likes: updatedProject.likes,
        project: updatedProject
      });
    } catch (error) {
      console.error('Error liking project:', error);
      res.status(500).json({ 
        message: 'Error liking project', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
}

export const projectController = new ProjectController();
