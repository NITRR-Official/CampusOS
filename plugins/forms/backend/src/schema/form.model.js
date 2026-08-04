import mongoose from 'mongoose';

const formFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'text',
        'textarea',
        'number',
        'email',
        'select',
        'radio',
        'checkbox'
      ]
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String },
    options: [{ type: String }] // For select, radio, checkbox
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    fields: [formFieldSchema],
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft'
    }
  },
  { timestamps: true }
);

// Indexes for fast lookups by entity
formSchema.index({ entityType: 1, entityId: 1 });

export const FormModel = mongoose.model('Form', formSchema);
