import mongoose from 'mongoose';

const formResponseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true
    },
    userId: { type: String, required: true },
    answers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // Allows any type (string, number, array of strings for checkbox)
      required: true
    },
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Indexes
formResponseSchema.index({ formId: 1, userId: 1 });
formResponseSchema.index({ formId: 1 });

export const FormResponseModel = mongoose.model(
  'FormResponse',
  formResponseSchema
);
