import mongoose from 'mongoose';
import { Role } from './role.schema.js';

const clubMemberSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true },
  clubId: { type: String, ref: 'Club', required: true }, // fixed "typeof" → "type"
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
  joinedAt: { type: Date, default: Date.now }
});

// Prevent duplicate membership
clubMemberSchema.index({ userId: 1, clubId: 1 }, { unique: true });

export const ClubMember = mongoose.model('ClubMember', clubMemberSchema);
