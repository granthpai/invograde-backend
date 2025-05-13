import mongoose, { Schema } from "mongoose";

export interface ICertification {
    name: string;
    issuedBy: string;
    date?: Date;
  }
  
export const CertificationSchema: Schema = new Schema({
    name: { type: String, required: true },
    issuedBy: { type: String, required: true },
    date: { type: Date }
  });

export const Certification = mongoose.model<ICertification>('Certification', CertificationSchema);