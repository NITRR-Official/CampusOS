import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,
    entityId: mongoose.Schema.Types.ObjectId,
    entityType: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true, collection: 'activitylogs' } // assuming the collection is 'activitylogs'
);

const ActivityLog = mongoose.model('ActivityLog', activitySchema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/campusos');
  const dummyLogs = [
    { action: 'auth:login', entityType: 'user', metadata: { ip: '127.0.0.1' } },
    {
      action: 'club:created',
      entityType: 'club',
      metadata: { name: 'Robotics Club' }
    },
    {
      action: 'club:approved',
      entityType: 'club',
      metadata: { name: 'Robotics Club' }
    },
    {
      action: 'event:created',
      entityType: 'event',
      metadata: { title: 'Hackathon 2026' }
    },
    {
      action: 'event:published',
      entityType: 'event',
      metadata: { title: 'Hackathon 2026' }
    },
    {
      action: 'plugin:enabled',
      entityType: 'plugin',
      metadata: { plugin: 'analytics' }
    },
    {
      action: 'user:registered',
      entityType: 'user',
      metadata: { email: 'test@example.com' }
    },
    {
      action: 'club:member:added',
      entityType: 'club',
      metadata: { userId: '123' }
    },
    {
      action: 'budget:approved',
      entityType: 'budget',
      metadata: { amount: 5000 }
    },
    {
      action: 'task:created',
      entityType: 'task',
      metadata: { title: 'Setup stage' }
    },
    {
      action: 'task:status_updated',
      entityType: 'task',
      metadata: { status: 'in-progress' }
    },
    {
      action: 'resource:allocated',
      entityType: 'resource',
      metadata: { resourceName: 'Main Hall' }
    }
  ];

  // Make the timestamps slightly different so they are ordered nicely
  for (let i = 0; i < dummyLogs.length; i++) {
    const log = dummyLogs[i];
    const date = new Date(Date.now() - (dummyLogs.length - i) * 60000); // spread by 1 minute each
    await ActivityLog.create({ ...log, createdAt: date, updatedAt: date });
  }

  console.log('Dummy activity logs generated');
  process.exit(0);
}
run();
