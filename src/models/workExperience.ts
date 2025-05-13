import mongoose, { Schema } from "mongoose";

export interface IWorkExperience {
    title: string;
    company: string;
    startDate?: Date;
    endDate?: Date;
    ongoing?: boolean;
    description?: string;
  }
  
export const WorkExperienceSchema: Schema = new Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    ongoing: { type: Boolean, default: false },
    description: { type: String }
  });

export const WorkExperience = mongoose.model<IWorkExperience>('WorkExperience', WorkExperienceSchema);