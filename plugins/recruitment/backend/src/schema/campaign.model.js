import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form', // Cross-plugin reference to the forms plugin
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft'
    },
    onboardRoleName: {
      type: String,
      default: 'volunteer'
    }
  },
  { timestamps: true }
);

// Indexes
campaignSchema.index({ entityType: 1, entityId: 1 });
campaignSchema.index({ formId: 1 });

export const CampaignModel = mongoose.model('Campaign', campaignSchema);
