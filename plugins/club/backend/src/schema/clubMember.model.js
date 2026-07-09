import mongoose from 'mongoose';

const clubMemberSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    userId: {
      type: String,
      ref: 'User',
      required: true
    },
    clubId: {
      type: String,
      ref: 'Club',
      required: true
    },
    roles: [
      {
        type: String,
        ref: 'Role'
      }
    ],
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'clubmembers'
  }
);

// Unique compound index so a user can only join a club once
clubMemberSchema.index({ userId: 1, clubId: 1 }, { unique: true });
clubMemberSchema.index({ clubId: 1 }); // For querying all members of a club

export const ClubMember = mongoose.model('ClubMember', clubMemberSchema);
export default ClubMember;
