import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-os';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const { default: registerAuditListener } =
    await import('../../plugins/activity/backend/src/listeners/audit.listener.js');
  const eventBus = new EventEmitter();
  registerAuditListener(eventBus);

  const clubId = '5a526719fb83493f5503fe75';

  console.log('Emitting task:created...');
  eventBus.emit('task:created', {
    taskId: '507f191e810c19729de860ef',
    title: 'Test Task',
    clubId: clubId
  });

  console.log('Emitting budget:created...');
  eventBus.emit('budget:created', {
    budgetId: '607f191e810c19729de860f0',
    amount: 500,
    clubId: clubId
  });

  console.log('Emitting resource:created...');
  eventBus.emit('resource:created', {
    resourceId: '707f191e810c19729de860f1',
    name: 'Projector',
    clubId: clubId
  });

  console.log('Emitting vendor:created...');
  eventBus.emit('vendor:created', {
    vendorId: '807f191e810c19729de860f2',
    name: 'Pizza Shop',
    clubId: clubId
  });

  // wait a bit for async handlers
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('Done emitting events.');
  process.exit(0);
}

run().catch(console.error);
