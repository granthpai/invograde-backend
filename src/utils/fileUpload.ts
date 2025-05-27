import { Request } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ObjectCannedACL } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'general'
): Promise<{ fileUrl: string; fileKey: string }> => {
  try {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const fileKey = `${folder}/${fileName}`;

    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read' as ObjectCannedACL
    };

    await s3Client.send(new PutObjectCommand(params));

    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    return { fileUrl, fileKey };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

export const deleteFromS3 = async (fileKey: string): Promise<void> => {
  try {
    if (!fileKey) {
      throw new Error('File key is required for deletion');
    }

    const params = {
      Bucket: bucketName,
      Key: fileKey
    };

    await s3Client.send(new DeleteObjectCommand(params));
    console.log(`Successfully deleted file: ${fileKey}`);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

export const getPresignedUrl = async (
  fileName: string,
  fileType: string,
  folder: string = 'general'
): Promise<{ presignedUrl: string; fileKey: string }> => {
  try {
    const fileExtension = path.extname(fileName);
    const fileKey = `${folder}/${uuidv4()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
      ACL: 'public-read' as ObjectCannedACL
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes

    return { presignedUrl, fileKey };
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

export const getFileUrl = (fileKey: string): string => {
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
};

export const validateS3Config = (): boolean => {
  const requiredEnvVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required AWS environment variables:', missingVars);
    return false;
  }
  
  return true;
};

export const isValidFileType = (file: Express.Multer.File): boolean => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  return allowedMimeTypes.includes(file.mimetype);
};

export const generateSafeFileName = (originalName: string): string => {
  const fileExtension = path.extname(originalName);
  const safeName = originalName
    .replace(fileExtension, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
  
  return `${safeName}_${uuidv4()}${fileExtension}`;
};