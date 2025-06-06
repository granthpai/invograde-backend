import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ProjectSchema, IProject } from "./project";

dotenv.config();

export interface IUser extends Document {
  username: string;
  email: string;
  phoneNumber?: string;
  password: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  careerType: "Developer" | "Designer" | "Both";
  gender?: "Male" | "Female" | "Other" | "Not Set";
  isStudent?: "Yes" | "No" | "Not Set";
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  projects: IProject[];
  createdAt: Date;
  updatedAt: Date;
  matchPassword: (enteredPassword: string) => Promise<boolean>;
  getSignedJwtToken: () => string;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Please add a username"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot be more than 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      match: [
        /^\+[1-9]\d{1,14}$/,
        "Please add a valid phone number in E.164 format",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    careerType: {
      type: String,
      enum: ["Developer", "Designer", "Both"],
      required: [true, "Please select a career type"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Not Set"],
      default: "Not Set",
    },
    isStudent: {
      type: String,
      enum: ["Yes", "No", "Not Set"],
      default: "Not Set",
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};
UserSchema.methods.getSignedJwtToken = function () {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRE;

  if (!secret || !expiresIn) {
    throw new Error(
      "JWT_SECRET and JWT_EXPIRE must be set in environment variables"
    );
  }

  return jwt.sign({ id: this._id }, secret as jwt.Secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
};

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
