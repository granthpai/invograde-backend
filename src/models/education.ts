import mongoose, { Schema } from "mongoose";

export interface IEducation {
    degree: string;
    major: string;
    institution?: string;
    startDate?: Date;
    endDate?: Date;
    ongoing?: boolean;
  }
  
export const EducationSchema: Schema = new Schema({
    degree: { type: String, required: true },
    major: { type: String, required: true },
    institution: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    ongoing: { type: Boolean, default: false }
  });

export const Education = mongoose.model<IEducation>('Education', EducationSchema);