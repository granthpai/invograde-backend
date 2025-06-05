import express from 'express';
import profileController from '../controllers/profileController';
import { protect } from '../middlewares/authMiddleware';
import { validateProfileUpdate, validateSkill } from '../middlewares/validation';
import { upload } from '../utils/resumeUpload';

const router = express.Router();

router.use(protect);

router.get('/', profileController.getProfile);
router.put('/', validateProfileUpdate, profileController.updateProfile);
router.post('/upload/resume', upload.single('resume'), profileController.uploadResume);
router.post('/upload/profile-picture', upload.single('profilePicture'), profileController.uploadProfilePicture);
router.delete('/resume', profileController.deleteResume);

router.post('/skills', validateSkill, profileController.addSkill);
router.put('/skills/:skillId', validateSkill, profileController.updateSkill);
router.delete('/skills/:skillId', profileController.deleteSkill);

router.post('/education', profileController.addEducation);
router.post('/work-experience', profileController.addWorkExperience);
router.post('/certifications', profileController.addCertifications);

export default router;