import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true
    },
    userId: { type: String, required: true },
    responseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FormResponse', // Cross-plugin reference
      required: true
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview', 'selected', 'rejected'],
      default: 'applied'
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

// Indexes
candidateSchema.index({ campaignId: 1 });
candidateSchema.index({ campaignId: 1, status: 1 });
candidateSchema.index({ userId: 1 });

export const CandidateModel = mongoose.model('Candidate', candidateSchema);
