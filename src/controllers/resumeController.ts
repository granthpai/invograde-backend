import { Request, Response } from 'express';
import { Resume } from '../models/resume';
import { ISkill } from '../models/skill';
import {IEducation} from '../models/education';
import {IWorkExperience} from '../models/workExperience';
import {ICertification} from '../models/certification';
import mongoose from 'mongoose';

export class ResumeController {
  async getOrCreateResume(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      let resume = await Resume.findOne({ userId });

      if (!resume) {
        resume = new Resume({ userId });
        await resume.save();
      }

      res.status(200).json({
        message: 'Resume retrieved successfully',
        resume
      });
    } catch (error) {
      console.error('Error retrieving/creating resume:', error);
      res.status(500).json({ 
        message: 'Error retrieving/creating resume', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async addSkills(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const skills: ISkill[] = req.body.skills;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        { $set: { skills } },
        { new: true, upsert: true }
      );

      res.status(200).json({
        message: 'Skills added successfully',
        skills: resume.skills
      });
    } catch (error) {
      console.error('Error adding skills:', error);
      res.status(500).json({ 
        message: 'Error adding skills', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async addEducation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const education: IEducation = req.body.education;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        { $push: { education } },
        { new: true, upsert: true }
      );

      res.status(200).json({
        message: 'Education added successfully',
        education: resume.education
      });
    } catch (error) {
      console.error('Error adding education:', error);
      res.status(500).json({ 
        message: 'Error adding education', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

    // Add Work Experience
  async addWorkExperience(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const workExperience: IWorkExperience = req.body.workExperience;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        { $push: { workExperience } },
        { new: true, upsert: true }
      );

      res.status(200).json({
        message: 'Work experience added successfully',
        workExperience: resume.workExperience
      });
    } catch (error) {
      console.error('Error adding work experience:', error);
      res.status(500).json({ 
        message: 'Error adding work experience', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async addCertifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const certification: ICertification = req.body.certification;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        { $push: { certifications: certification } },
        { new: true, upsert: true }
      );

      res.status(200).json({
        message: 'Certification added successfully',
        certifications: resume.certifications
      });
    } catch (error) {
      console.error('Error adding certification:', error);
      res.status(500).json({ 
        message: 'Error adding certification', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async updateResumeSection(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { section, id } = req.params;
      const updateData = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      let updateQuery = {};
      let arrayFilters = [];

      switch(section) {
        case 'skills':
          updateQuery = { 
            $set: { 
              'skills.$[elem]': updateData 
            } 
          };
          arrayFilters = [{ 'elem._id': new mongoose.Types.ObjectId(id) }];
          break;
        case 'education':
          updateQuery = { 
            $set: { 
              'education.$[elem]': updateData 
            } 
          };
          arrayFilters = [{ 'elem._id': new mongoose.Types.ObjectId(id) }];
          break;
        case 'workExperience':
          updateQuery = { 
            $set: { 
              'workExperience.$[elem]': updateData 
            } 
          };
          arrayFilters = [{ 'elem._id': new mongoose.Types.ObjectId(id) }];
          break;
        case 'certifications':
          updateQuery = { 
            $set: { 
              'certifications.$[elem]': updateData 
            } 
          };
          arrayFilters = [{ 'elem._id': new mongoose.Types.ObjectId(id) }];
          break;
        default:
          return res.status(400).json({ message: 'Invalid section' });
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        updateQuery,
        { 
          new: true, 
          arrayFilters: arrayFilters 
        }
      );

      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      res.status(200).json({
        message: `${section} updated successfully`,
        resume
      });
    } catch (error) {
      console.error(`Error updating ${req.params.section}:`, error);
      res.status(500).json({ 
        message: `Error updating ${req.params.section}`, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async deleteResumeSection(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { section, id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      let updateQuery = {};

      switch(section) {
        case 'skills':
          updateQuery = { 
            $pull: { skills: { _id: new mongoose.Types.ObjectId(id) } } 
          };
          break;
        case 'education':
          updateQuery = { 
            $pull: { education: { _id: new mongoose.Types.ObjectId(id) } } 
          };
          break;
        case 'workExperience':
          updateQuery = { 
            $pull: { workExperience: { _id: new mongoose.Types.ObjectId(id) } } 
          };
          break;
        case 'certifications':
          updateQuery = { 
            $pull: { certifications: { _id: new mongoose.Types.ObjectId(id) } } 
          };
          break;
        default:
          return res.status(400).json({ message: 'Invalid section' });
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        updateQuery,
        { new: true }
      );

      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      res.status(200).json({
        message: `${section} item deleted successfully`,
        resume
      });
    } catch (error) {
      console.error(`Error deleting ${req.params.section} item:`, error);
      res.status(500).json({ 
        message: `Error deleting ${req.params.section} item`, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
}