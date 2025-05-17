import { ISkill } from "./skill";
import { IEducation } from "./education";
import { IWorkExperience } from "./workExperience";
import { ICertification } from "./certification";
import mongoose, { Document, Schema } from "mongoose";
import { SkillSchema } from "./skill";
import { EducationSchema } from "./education";
import { WorkExperienceSchema } from "./workExperience";
import { CertificationSchema } from "./certification";

export interface IResume extends Document {
    userId: string;
    skills: ISkill[];
    education: IEducation[];
    workExperience: IWorkExperience[];
    certifications: ICertification[];
    summary?: string;
    projects?: any[];
    languages?: string[];
    interests?: string[];
}

const ResumeSchema: Schema = new Schema({
    userId: { type: String, required: true, unique: true },
    skills: [SkillSchema],
    education: [EducationSchema],
    workExperience: [WorkExperienceSchema],
    certifications: [CertificationSchema],
    summary: { type: String },
    projects: [{
        title: { type: String },
        description: { type: String },
        technologies: [{ type: String }],
        startDate: { type: Date },
        endDate: { type: Date },
        url: { type: String }
    }],
    languages: [{ type: String }],
    interests: [{ type: String }]
}, {
    timestamps: true
});

export const Resume = mongoose.model<IResume>('Resume', ResumeSchema);