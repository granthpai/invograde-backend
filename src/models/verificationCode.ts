import mongoose, { Document, Schema } from 'mongoose';

export interface IVerificationCode extends Document {
  user: mongoose.Types.ObjectId;
  code: string;
  type: 'email' | 'phone';
  expiresAt: Date;
  createdAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['email', 'phone'],
      required: true,
    },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 60 * 1000);//1min
      },
    },
  },
  {
    timestamps: true,
  }
);

VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationCode = mongoose.model<IVerificationCode>('VerificationCode',VerificationCodeSchema);

export default VerificationCode;
