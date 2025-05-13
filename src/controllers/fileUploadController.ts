import { Request, Response } from 'express';
import { uploadToS3, getPresignedUrl } from '../config/fileUpload';

class FileUploadController {
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const result = await uploadToS3(req.file, 'user-uploads');

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileUrl: result.fileUrl,
          fileKey: result.fileKey,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload file'
      });
    }
  }

  async getPresignedUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileName, fileType } = req.body;

      if (!fileName || !fileType) {
        res.status(400).json({
          success: false,
          message: 'File name and type are required'
        });
        return;
      }

      const { presignedUrl, fileKey } = await getPresignedUrl(
        fileName,
        fileType,
        'user-uploads'
      );

      const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${
        process.env.AWS_REGION
      }.amazonaws.com/${fileKey}`;

      res.status(200).json({
        success: true,
        data: {
          presignedUrl,
          fileKey,
          publicUrl
        }
      });
    } catch (error) {
      console.error('Presigned URL generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate upload URL'
      });
    }
  }
}

export default new FileUploadController();