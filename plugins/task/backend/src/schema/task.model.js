import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: null,
      trim: true
    },
    assigneeName: {
      type: String,
      default: null,
      trim: true
    },
    dueDate: {
      type: Date,
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dependsOn: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
      }
    ]
  },
  {
    timestamps: true,
    collection: 'tasks'
  }
);

// Indexes
taskSchema.index({ clubId: 1 });
taskSchema.index({ clubId: 1, assigneeName: 1 });
taskSchema.index({ clubId: 1, status: 1 });
taskSchema.index({ clubId: 1, dueDate: 1 });
taskSchema.index({ clubId: 1, createdBy: 1 });
taskSchema.index({ createdBy: 1 });

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

export const Task = mongoose.model('Task', taskSchema);
