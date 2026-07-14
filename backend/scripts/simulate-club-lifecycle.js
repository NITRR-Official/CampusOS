import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/campusos';

async function simulateLifecycle() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Dynamic imports to ensure mongoose is connected before loading models
    const { User } = await import('../src/database/schemas/user.schema.js');
    const { Club } =
      await import('../../plugins/club/backend/src/schema/club.model.js');
    const { Role } =
      await import('../../plugins/club/backend/src/schema/role.model.js');
    const { ClubMember } =
      await import('../../plugins/club/backend/src/schema/clubMember.model.js');

    // 1. Create dummy users
    console.log('Creating dummy users...');
    const ownerUser = await User.findOneAndUpdate(
      { email: 'sandbox-owner@example.com' },
      {
        name: 'Sandbox Owner',
        email: 'sandbox-owner@example.com',
        passwordHash: 'dummy-hash', // Note: in reality, use bcrypt
        isActive: true
      },
      { upsert: true, new: true }
    );

    const memberUser = await User.findOneAndUpdate(
      { email: 'sandbox-member@example.com' },
      {
        name: 'Sandbox Member',
        email: 'sandbox-member@example.com',
        passwordHash: 'dummy-hash',
        isActive: true
      },
      { upsert: true, new: true }
    );

    // 2. Create Sandbox Club
    console.log('Creating Sandbox Club...');
    const sandboxClub = await Club.findOneAndUpdate(
      { slug: 'sandbox-club' },
      {
        name: 'Sandbox Club',
        slug: 'sandbox-club',
        email: 'sandbox@example.com',
        instituteId: 'NITRR',
        description: 'A club for testing lifecycle events.',
        category: 'Technology',
        status: 'approved',
        createdBy: ownerUser._id
      },
      { upsert: true, new: true }
    );

    // 3. Setup Roles
    console.log('Setting up roles...');
    const ownerRole = await Role.findOneAndUpdate(
      { clubId: sandboxClub._id, name: 'owner' },
      {
        clubId: sandboxClub._id,
        name: 'owner',
        permissions: ['club:manage', 'role:manage', 'member:manage'],
        hierarchyLevel: 1000,
        isTemplate: true,
        roleType: 'role'
      },
      { upsert: true, new: true }
    );

    const memberRole = await Role.findOneAndUpdate(
      { clubId: sandboxClub._id, name: 'member' },
      {
        clubId: sandboxClub._id,
        name: 'member',
        permissions: ['club:view'],
        hierarchyLevel: 0,
        isTemplate: true,
        roleType: 'role'
      },
      { upsert: true, new: true }
    );

    // 4. Assign Users to Club
    console.log('Assigning members to club...');
    await ClubMember.findOneAndUpdate(
      { userId: ownerUser._id, clubId: sandboxClub._id },
      {
        userId: ownerUser._id,
        clubId: sandboxClub._id,
        roles: [ownerRole._id]
      },
      { upsert: true, new: true }
    );

    await ClubMember.findOneAndUpdate(
      { userId: memberUser._id, clubId: sandboxClub._id },
      {
        userId: memberUser._id,
        clubId: sandboxClub._id,
        roles: [memberRole._id]
      },
      { upsert: true, new: true }
    );

    console.log('Lifecycle simulation setup complete!');
    console.log('--------------------------------------------------');
    console.log(`Club Slug: ${sandboxClub.slug}`);
    console.log(`Owner Email: ${ownerUser.email}`);
    console.log(`Member Email: ${memberUser.email}`);
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('Lifecycle simulation failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

simulateLifecycle();
