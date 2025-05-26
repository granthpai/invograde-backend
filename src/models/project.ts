import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  skills: string[];
  domain?: string;
  tags?: string[];
  userId: mongoose.Schema.Types.ObjectId;
  thumbnail?: string;
  likes?: number;
  likesBy?: string[];
  projectUrl?: string;
  githubUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ProjectSchema: Schema = new Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  skills: [{
    type: String
  }],
  domain: { 
    type: String 
  },
  tags: [{ 
    type: String 
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  thumbnail: { 
    type: String 
  },
  likes: { 
    type: Number, 
    default: 0 
  },
  likesBy: [{
    type: String
  }],
  projectUrl: {
    type: String,
    match: [
      /^https?:\/\/.+/,
      'Please provide a valid URL'
    ],
  },
  githubUrl: {
    type: String,
    match: [
      /^https?:\/\/(www\.)?github\.com\/.+/,
      'Please provide a valid GitHub URL'
    ],
  },
}, {
  timestamps: true
});

export const Project = mongoose.model<IProject>('Project', ProjectSchema);