import mongoose from 'mongoose';

const verificationTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      // Automatically delete documents after they expire
      expires: 0
    }
  },
  { timestamps: true }
);

export const VerificationToken = mongoose.model(
  'VerificationToken',
  verificationTokenSchema
);
