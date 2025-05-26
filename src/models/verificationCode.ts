import mongoose, { Document, Schema } from "mongoose";

interface TempUserData {
  email?: string;
  phoneNumber?: string;
  password: string;
  username: string;
  careerType: string;
}

export interface IVerificationCode extends Document {
  code: string;
  type: "email" | "phone";
  expiresAt: Date;
  createdAt: Date;
  tempUserData: TempUserData;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["email", "phone"],
      required: true,
    },
    tempUserData: {
      email: { type: String },
      phoneNumber: { type: String },
      password: { type: String, required: true },
      username: { type: String, required: true },
      careerType: { type: String, required: true },
    },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 60 * 1000); // 1 min
      },
    },
  },
  {
    timestamps: true,
  }
);

VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationCode = mongoose.model<IVerificationCode>(
  "VerificationCode",
  VerificationCodeSchema
);

export default VerificationCode;
