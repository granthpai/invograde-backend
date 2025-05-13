import express from 'express';
import { body, param } from 'express-validator';
import { ResumeController } from '../controllers/resumeController';
import { protect } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';

const router = express.Router();
const resumeController = new ResumeController();

router.get('/',
  protect,
  resumeController.getOrCreateResume
);

router.post('/skills',
  protect,
  body('skills').isArray().withMessage('Skills must be an array'),
  validateRequest,
  resumeController.addSkills
);

router.post('/education',
  protect,
  body('education.institution').notEmpty().withMessage('Institution is required'),
  body('education.degree').notEmpty().withMessage('Degree is required'),
  validateRequest,
  resumeController.addEducation
);

router.post('/work-experience',
  protect,
  body('workExperience.company').notEmpty().withMessage('Company is required'),
  body('workExperience.title').notEmpty().withMessage('Title is required'),
  validateRequest,
  resumeController.addWorkExperience
);

router.post('/certifications',
  protect,
  body('certification.name').notEmpty().withMessage('Certification name is required'),
  body('certification.issuer').notEmpty().withMessage('Issuer is required'),
  validateRequest,
  resumeController.addCertifications
);

router.put('/:section/:id',
  protect,
  param('section').isIn(['skills', 'education', 'workExperience', 'certifications']),
  param('id').isMongoId().withMessage('Invalid ID'),
  validateRequest,
  resumeController.updateResumeSection
);

router.delete('/:section/:id',
  protect,
  param('section').isIn(['skills', 'education', 'workExperience', 'certifications']),
  param('id').isMongoId().withMessage('Invalid ID'),
  validateRequest,
  resumeController.deleteResumeSection
);

export default router;