import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Some system events might not have a direct user actor
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // E.g., generic system logs might not have an entity
      index: true
    },
    entityType: {
      type: String,
      required: false,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Compound indexes for fast querying of feeds
activitySchema.index({ entityId: 1, createdAt: -1 });
activitySchema.index({ actorId: 1, createdAt: -1 });

// Optional TTL Data Retention driven by Environment Variables
const retentionDays = parseInt(process.env.ACTIVITY_LOG_RETENTION_DAYS, 10);
if (!isNaN(retentionDays) && retentionDays > 0) {
  const expireAfterSeconds = retentionDays * 24 * 60 * 60;
  activitySchema.index({ createdAt: 1 }, { expireAfterSeconds });
}

export const ActivityLog = mongoose.model('ActivityLog', activitySchema);
export default ActivityLog;
