import mongoose, { Schema, Document } from 'mongoose';

export interface ISkill {
  name: string;
  experience?: string;
}

export const SkillSchema: Schema = new Schema({
  name: { type: String, required: true },
  experience: { type: String, default: '' }
}); 

export const Skill = mongoose.model<ISkill>('Skill', SkillSchema);