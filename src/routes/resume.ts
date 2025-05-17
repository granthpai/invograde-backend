import express from 'express';
import { resumeController } from '../controllers/resumeController';
import { protect } from '../middlewares/auth';

const router = express.Router();


router.get('/', protect, (req, res) => resumeController.getOrCreateResume(req, res));
router.post('/skills', protect, (req, res) => resumeController.addSkills(req, res));
router.post('/education', protect, (req, res) => resumeController.addEducation(req, res));
router.post('/experience', protect, (req, res) => resumeController.addWorkExperience(req, res));
router.post('/certifications', protect, (req, res) => resumeController.addCertifications(req, res));
router.put('/:section/:id', protect, (req, res) => resumeController.updateResumeSection(req, res));
router.delete('/:section/:id', protect, (req, res) =>   resumeController.deleteResumeSection(req, res));

export default router;