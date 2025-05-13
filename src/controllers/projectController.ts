import { Request, Response } from 'express';
import { Project, IProject } from '../models/project';
import mongoose from 'mongoose';

export class ProjectController {
  async createProject(req: Request, res: Response) {
    try {
      const { 
        title, 
        description, 
        skills, 
        domain, 
        tags, 
        thumbnail 
      } = req.body;

      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const newProject: IProject = new Project({
        title,
        description,
        skills,
        domain,
        tags,
        userId,
        thumbnail,
        likes: 0
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

  async getUserProjects(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const projects = await Project.find({ userId })
        .sort({ createdAt: -1 });

      res.status(200).json({
        message: 'Projects retrieved successfully',
        projects
      });
    } catch (error) {
      console.error('Error retrieving projects:', error);
      res.status(500).json({ 
        message: 'Error retrieving projects', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async updateProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }

      const project = await Project.findOneAndUpdate(
        { _id: projectId, userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!project) {
        return res.status(404).json({ message: 'Project not found or unauthorized' });
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

  async deleteProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }

      const project = await Project.findOneAndDelete({ 
        _id: projectId, 
        userId 
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found or unauthorized' });
      }

      res.status(200).json({
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ 
        message: 'Error deleting project', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async likeProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }

      const project = await Project.findByIdAndUpdate(
        projectId,
        { $inc: { likes: 1 } },
        { new: true }
      );

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.status(200).json({
        message: 'Project liked successfully',
        likes: project.likes
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