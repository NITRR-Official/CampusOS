import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const RoleSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    name: { type: String, required: true },
    permissions: [{ type: String }],
    hierarchyLevel: { type: Number, required: true, default: 0 },
    isTemplate: { type: Boolean, default: false },
    color: { type: String, default: '#808080' }
  },
  { collection: 'roles' } // from club plugin
);

const Role = mongoose.model('Role', RoleSchema);

async function migrate() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-os';

  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);
  console.log('Connected.');

  console.log('Migrating coordinator roles...');
  const coordinatorRoles = await Role.find({ name: 'coordinator' });
  for (const role of coordinatorRoles) {
    const newPerms = new Set(role.permissions);
    newPerms.add('event:view');
    newPerms.add('task:view');
    newPerms.add('budget:view');
    newPerms.add('resource:view');
    newPerms.add('vendor:view');
    role.permissions = Array.from(newPerms);
    await role.save();
  }
  console.log(`Updated ${coordinatorRoles.length} coordinator roles.`);

  console.log('Migrating volunteer roles...');
  const volunteerRoles = await Role.find({ name: 'volunteer' });
  for (const role of volunteerRoles) {
    const newPerms = new Set(role.permissions);
    newPerms.add('event:view');
    newPerms.add('task:view');
    newPerms.add('resource:view');
    role.permissions = Array.from(newPerms);
    await role.save();
  }
  console.log(`Updated ${volunteerRoles.length} volunteer roles.`);

  console.log('Migrating custom roles with basic access...');
  const customRoles = await Role.find({
    name: { $nin: ['owner', 'admin', 'coordinator', 'volunteer'] },
    permissions: { $not: { $elemMatch: { $eq: 'administrator' } } }
  });

  let customUpdated = 0;
  for (const role of customRoles) {
    if (role.permissions.length > 0) {
      const newPerms = new Set(role.permissions);
      newPerms.add('event:view');
      newPerms.add('task:view');
      newPerms.add('resource:view');

      // If they can manage budgets, they should view budgets
      if (newPerms.has('budget:manage')) newPerms.add('budget:view');
      // If they can manage vendors, they should view vendors
      if (newPerms.has('vendor:manage')) newPerms.add('vendor:view');

      role.permissions = Array.from(newPerms);
      await role.save();
      customUpdated++;
    }
  }
  console.log(`Updated ${customUpdated} custom roles.`);

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
