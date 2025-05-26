import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import fileUploadController from '../controllers/fileUploadController';
import { protect } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validation';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/upload', 
  protect, 
  upload.single('file'), 
  fileUploadController.uploadFile
);

router.post('/presigned-url',
  protect,
  body('fileName').notEmpty().withMessage('File name is required'),
  body('fileType').notEmpty().withMessage('File type is required'),
  validateRequest,
  fileUploadController.getPresignedUploadUrl
);



export default router;