
import express from 'express';
import { projectController } from '../controllers/projectController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.post('/', protect, (req, res) => projectController.createProject(req, res));
router.get('/user', protect, (req, res) => projectController.getUserProjects(req, res));
router.put('/:projectId', protect, (req, res) => projectController.updateProject(req, res));
router.delete('/:projectId', protect, (req, res) => projectController.deleteProject(req, res));
router.post('/:projectId/like', protect, (req, res) => projectController.likeProject(req, res));

export default router;