import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
  specialization: {
    type: String,
    trim: true,
    maxlength: [100, 'Specialization cannot exceed 100 characters']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Others'],
    default: 'Others'
  },
  isStudent: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: null
  },
  resume: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  skills: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    yearsOfExperience: {
      type: Number,
    }
  }],
  education: [{
    degree: {
      type: String,
      required: true,
      trim: true
    },
    fieldOfStudy: {
      type: String,
      trim: true
    },
  }],
  workExperience: [{
    jobTitle: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    expiryMonth: Number,
    expiryYear: Number
  }],
  emailVerificationToken: String
}, {
  timestamps: true,
});

export const Profile = mongoose.model('Profile', profileSchema);