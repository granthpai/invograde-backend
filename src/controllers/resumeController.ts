import { Request, Response } from 'express';
import { Resume } from '../models/resume';
import mongoose from 'mongoose';

export class ResumeController {
  async getOrCreateResume(req: Request, res: Response):Promise<void> {
    try {
      const userId = req.user?.id as string;

      if (!userId) {
         res.status(401).json({ message: 'Unauthorized' });
         return;
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }

      let resume = await Resume.findOne({ userId });

      if (!resume) {
        resume = new Resume({ userId });
        await resume.save();
      }

      const completeResume = {
        ...resume.toObject(),
        skills: resume.skills || [],
        education: resume.education || [],
        workExperience: resume.workExperience || [],
        certifications: resume.certifications || [],
        summary: resume.summary || '',
        projects: resume.projects || [],
        languages: resume.languages || [],
        interests: resume.interests || []
      };

      res.status(200).json({
        message: resume._id ? 'Resume retrieved successfully' : 'New resume created successfully',
        resume: completeResume
      });
    } catch (error) {
      console.error('Error retrieving/creating resume:', error);
      res.status(500).json({ 
        message: 'Error retrieving/creating resume', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async addSkills(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const skills = req.body.skills;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!skills || !Array.isArray(skills)) {
        res.status(400).json({ message: 'Skills must be an array' });
        return;
      }

      if (!skills.every(skill => typeof skill === 'object' && 
        'name' in skill && typeof skill.name === 'string')) {
        res.status(400).json({ 
          message: 'Invalid skill format. Each skill must be an object with a name property' 
        });
        return;
      }

      const existingResume = await Resume.findOne({ userId });
      if (!existingResume) {
        res.status(404).json({ message: 'Resume not found' });
        return;
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        { $set: { skills } },
        { new: true, runValidators: true }
      );

      if (!resume) {
        res.status(404).json({ message: 'Failed to update resume' });
        return;
      }

      res.status(200).json({
        message: 'Skills added successfully',
        skills: resume.skills,
        resumeId: resume._id
      });
    } catch (error) {
      console.error('Error adding skills:', error);
      res.status(500).json({ 
        message: 'Error adding skills', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async addEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const education = req.body.education;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!education || typeof education !== 'object') {
        res.status(400).json({ message: 'Invalid education data' });
        return;
      }
      const requiredFields = ['institution', 'degree', 'startDate'];
      const missingFields = requiredFields.filter(field => !(field in education));
      if (missingFields.length > 0) {
        res.status(400).json({ 
          message: 'Missing required fields',
          missingFields
        });
        return;
      }

      const existingResume = await Resume.findOne({ userId });
      if (!existingResume) {
        res.status(404).json({ message: 'Resume not found' });
        return;
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        { $push: { education } },
        { new: true, runValidators: true }
      );

      if (!resume) {
        res.status(404).json({ message: 'Failed to update resume' });
        return;
      }

      res.status(200).json({
        message: 'Education added successfully',
        education: resume.education,
        resumeId: resume._id
      });
    } catch (error) {
      console.error('Error adding education:', error);
      res.status(500).json({ 
        message: 'Error adding education', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

    
  async addWorkExperience(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const workExperience = req.body.workExperience;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!workExperience || typeof workExperience !== 'object') {
        res.status(400).json({ message: 'Invalid work experience data' });
        return;
      }
      const requiredFields = ['company', 'position', 'startDate'];
      const missingFields = requiredFields.filter(field => !(field in workExperience));
      if (missingFields.length > 0) {
        res.status(400).json({ 
          message: 'Missing required fields',
          missingFields
        });
        return;
      }

      const existingResume = await Resume.findOne({ userId });
      if (!existingResume) {
        res.status(404).json({ message: 'Resume not found' });
        return;
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        { $push: { workExperience } },
        { new: true, runValidators: true }
      );

      if (!resume) {
        res.status(404).json({ message: 'Failed to update resume' });
        return;
      }

      res.status(200).json({
        message: 'Work experience added successfully',
        workExperience: resume.workExperience,
        resumeId: resume._id
      });
    } catch (error) {
      console.error('Error adding work experience:', error);
      res.status(500).json({ 
        message: 'Error adding work experience', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async addCertifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const certifications = req.body.certifications;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!certifications || !Array.isArray(certifications)) {
        res.status(400).json({ message: 'Certifications must be an array' });
        return;
      }
      const requiredFields = ['name', 'issuingOrganization', 'date'];
      const invalidCertifications = certifications.filter((cert: any) => {
        const missingFields = requiredFields.filter(field => !(field in cert));
        return missingFields.length > 0;
      });

      if (invalidCertifications.length > 0) {
        res.status(400).json({ 
          message: 'Invalid certification format',
          invalidCertifications
        });
        return;
      }

      
      const existingResume = await Resume.findOne({ userId });
      if (!existingResume) {
        res.status(404).json({ message: 'Resume not found' });
        return;
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        { $set: { certifications } },
        { new: true, runValidators: true }
      );

      if (!resume) {
        res.status(404).json({ message: 'Failed to update resume' });
        return;
      }

      res.status(200).json({
        message: 'Certifications added successfully',
        certifications: resume.certifications,
        resumeId: resume._id
      });
    } catch (error) {
      console.error('Error adding certification:', error);
      res.status(500).json({ 
        message: 'Error adding certification', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  async updateResumeSection(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { section, id } = req.params;
      const updateData = req.body;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
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
          res.status(400).json({ message: 'Invalid section' });
          return;
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
        res.status(404).json({ message: 'Resume not found' });
        return;
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

  async deleteResumeSection(req: Request, res: Response): Promise<void>    {
    try {
      const userId = req.user?.id;
      const { section, id } = req.params;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
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
          res.status(400).json({ message: 'Invalid section' });
          return;
      }

      const resume = await Resume.findOneAndUpdate(
        { userId },
        updateQuery,
        { new: true }
      );

      if (!resume) {
        res.status(404).json({ message: 'Resume not found' });
        return;
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

export const resumeController = new ResumeController();