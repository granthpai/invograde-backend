import mongoose, { Schema, Document } from 'mongoose';

export interface Skill {
  name: string;
  category?: string;
}
export interface IProject extends Document {
  title: string;
  description: string;
  skills: Skill[];
  domain?: string;
  tags?: string[];
  userId: string;
  thumbnail?: string;
  isPublic?: boolean;
  likes?: number;
  likesBy?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ProjectSchema: Schema = new Schema({
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
    name: { type: String, required: true },
    category: { type: String }
  }],
  domain: { 
    type: String 
  },
  tags: [{ 
    type: String 
  }],
  userId: { 
    type: String, 
    required: true 
  },
  thumbnail: { 
    type: String 
  },
  isPublic: { 
    type: Boolean, 
    default: true 
  },
  likes: { 
    type: Number, 
    default: 0 
  },
  likesBy: [{
    type: String,
    ref: 'User'
  }]
}, {
  timestamps: true
});

export const Project = mongoose.model<IProject>('Project', ProjectSchema);