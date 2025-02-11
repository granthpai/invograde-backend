import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    career: "developer" | "designer" | "both";
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    emailVerified: boolean;
    emailVerificationToken?: string;
}

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        career: {
            type: String,
            enum: ["developer", "designer", "both"],
            default: "developer",
            required: true,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: {
            type: String,
        },
    },
    { timestamps: true } // ✅ Moved this outside the main object
);

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
