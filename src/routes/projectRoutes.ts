import express from 'express';
import { body, param } from 'express-validator';
import { ProjectController } from '../controllers/projectController';
import { protect } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';

const router = express.Router();
const projectController = new ProjectController();

router.post('/',
  protect,
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  validateRequest,
  projectController.createProject
);

router.get('/',
  protect,
  projectController.getUserProjects
);

router.put('/:projectId',
  protect,
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  validateRequest,
  projectController.updateProject
);

router.delete('/:projectId',
  protect,
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  validateRequest,
  projectController.deleteProject
);

router.post('/:projectId/like',
  protect,
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  validateRequest,
  projectController.likeProject
);

export default router;