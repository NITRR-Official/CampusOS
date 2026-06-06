import mongoose from 'mongoose';
export const PERMISSIONS = {
    ADMINISTRATOR: 'administrator',
    CLUB_MANAGE: 'club:manage',
    ROLE_MANAGE: 'role:manage',
    MEMBER_MANAGE: 'member:manage',
    EVENT_CREATE: 'event:create',
    EVENT_MANAGE: 'event:manage',
    BUDGET_VIEW: 'budget:view',
    BUDGET_MANAGE: 'budget:manage',
    TASK_MANAGE: 'task:manage',
};

const roleSchema = new mongoose.Schema({
    clubId:{type:String,ref:'Club',default:null},
    name: { type: String, required: true },
    permissions: [{ type: String, enum: Object.values(PERMISSIONS) }],
    hierarchyLevel: { type: Number, default: 1 },
    isTemplate: { type: Boolean, default: false },
    roleType: { type: String, enum: ['role', 'team'], default: 'role' },
    color: { type: String }
});

export const Role=mongoose.model('Role',roleSchema);