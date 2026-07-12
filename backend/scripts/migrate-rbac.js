import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock registry for the migration script to validate against
// We import the plugins to register their permissions
import registry from '../src/utils/registry.js';

// Import all plugins to ensure their permissions are registered
import initClub from '../../plugins/club/backend/src/index.js';
import initEvent from '../../plugins/event/backend/src/index.js';
import initTask from '../../plugins/task/backend/src/index.js';
import initBudget from '../../plugins/budget/backend/src/index.js';
import initResource from '../../plugins/resource/backend/src/index.js';
import initScheduling from '../../plugins/scheduling/backend/src/index.js';
import initVendor from '../../plugins/vendor/backend/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/campusos';

async function runMigration() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Initialize plugins (so they register their permissions with the registry)
    const mockApp = {
      get: () => {},
      post: () => {},
      put: () => {},
      delete: () => {},
      patch: () => {},
      use: () => {}
    };
    const mockEventBus = { on: () => {}, emit: () => {} };

    // Mock getService so plugins don't crash
    const originalGetService = registry.getService.bind(registry);
    registry.getService = (name) => {
      if (name === 'requirePermissions')
        return () => (req, res, next) => next();
      if (name === 'core:models') return { User: {} };
      return originalGetService(name) || {};
    };

    await initClub(mockApp, registry, mockEventBus);
    await initEvent(mockApp, registry, mockEventBus);
    await initTask(mockApp, registry, mockEventBus);
    await initBudget(mockApp, registry, mockEventBus);
    await initResource(mockApp, registry, mockEventBus);
    await initScheduling(mockApp, registry, mockEventBus);
    await initVendor(mockApp, registry, mockEventBus);

    console.log(
      `Registered ${registry.permissions.getAll().length} permissions in registry.`
    );

    // Import Role model
    const { Role } =
      await import('../../plugins/club/backend/src/schema/role.model.js');

    const roles = await Role.find({});
    console.log(`Found ${roles.length} roles to process.`);

    let updatedCount = 0;

    for (const role of roles) {
      if (!role.permissions) continue;

      let modified = false;
      const validPermissions = [];

      for (const perm of role.permissions) {
        if (perm === 'administrator' || registry.permissions.has(perm)) {
          validPermissions.push(perm);
        } else {
          console.log(
            `[Role ${role.name}] Removing invalid permission: ${perm}`
          );
          modified = true;
        }
      }

      if (modified) {
        role.permissions = validPermissions;
        await role.save();
        updatedCount++;
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} roles.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runMigration();
