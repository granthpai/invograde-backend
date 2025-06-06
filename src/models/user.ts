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
  fullName?: string;
  password: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  careerType: "Developer" | "Designer" | "Both";
  gender?: "Male" | "Female" | "Other" | "Not Set";
  isStudent?: "Yes" | "No" | "Not Set";
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  projects: IProject[];
  profilePicture?: string;
  specialization?: string;
  resume?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    uploadDate: Date;
    s3Key: string;
    s3Url: string;
  },
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: Date;
    expirationDate?: Date;
    certificateUrl?: string;
  }>;
  skills: Array<{
    _id: mongoose.Types.ObjectId;
    name: string;
    proficiency?: string;
    yearsOfExperience?: number;
  }>;
  workExperience: Array<{
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description?: string;
  }>;
  education: Array<{
    _id: mongoose.Types.ObjectId;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description?: string;
    year?: number;
    grade?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  matchPassword: (enteredPassword: string) => Promise<boolean>;
  getSignedJwtToken: () => string;
  emailVerificationToken?: string;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, "Please add a username"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters long"],
    maxlength: [30, "Username cannot be more than 30 characters"],
  },
  education: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId
    },
    institution: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      required: true
    },
    fieldOfStudy: {
      type: String
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    current: {
      type: Boolean,
      default: false
    },
    description: {
      type: String
    },
    year: {
      type: Number
    },
    grade: {
      type: String
    }
  }],
  workExperience: [{
    company: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: false,
    },
    current: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: false,
    },
  }],
  emailVerificationToken: {
    type: String,
    required: false,
  },
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
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please add a valid email"],
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\+[1-9]\d{1,14}$/, "Please add a valid phone number in E.164 format"],
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
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  }],
  skills: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    proficiency: String,
    yearsOfExperience: Number,
  }],
  emailVerificationToken: {
    type: String
  },
}, {
  timestamps: true,
});

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
