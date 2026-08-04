import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    email: String,
    description: String,
    category: String,
    status: String,
    createdBy: String
  },
  { timestamps: true, collection: 'clubs' }
);

const eventSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    instituteId: String,
    clubId: String,
    createdBy: String,
    venue: String,
    capacity: Number,
    startsAt: Date,
    endsAt: Date,
    status: String,
    registrations: Array
  },
  { timestamps: true, collection: 'events' }
);

const userSchema = new mongoose.Schema(
  {
    email: String,
    name: String,
    role: String,
    status: String,
    authProvider: String
  },
  { timestamps: true, collection: 'users' }
);

const Club = mongoose.model('Club', clubSchema);
const Event = mongoose.model('Event', eventSchema);
const User = mongoose.model('User', userSchema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/campusos');

  // Clear old data for a fresh start (optional, maybe not for clubs)
  // await Club.deleteMany({});
  // await Event.deleteMany({});

  const creatorId = new mongoose.Types.ObjectId().toString();

  const club1 = await Club.create({
    name: 'Robotics Club',
    slug: 'robotics-club',
    email: 'robotics@campus.edu',
    description: 'We build cool robots.',
    category: 'Technology',
    status: 'approved',
    createdBy: creatorId
  });

  const club2 = await Club.create({
    name: 'Dance Society',
    slug: 'dance-society',
    email: 'dance@campus.edu',
    description: 'Join us to dance!',
    category: 'Cultural',
    status: 'approved',
    createdBy: creatorId
  });

  await Event.create({
    title: 'Robo Wars 2026',
    description: 'Annual robotics competition.',
    instituteId: 'inst_1',
    clubId: club1._id.toString(),
    createdBy: creatorId,
    venue: 'Main Auditorium',
    capacity: 500,
    startsAt: new Date(Date.now() + 86400000 * 7), // next week
    endsAt: new Date(Date.now() + 86400000 * 7 + 3600000 * 5), // + 5 hours
    status: 'published'
  });

  await Event.create({
    title: 'Intro to Arduino',
    description: 'Beginner workshop for Arduino.',
    instituteId: 'inst_1',
    clubId: club1._id.toString(),
    createdBy: creatorId,
    venue: 'Lab 4',
    capacity: 50,
    startsAt: new Date(Date.now() + 86400000 * 2), // in 2 days
    endsAt: new Date(Date.now() + 86400000 * 2 + 3600000 * 2),
    status: 'draft'
  });

  await Event.create({
    title: 'Summer Gala',
    description: 'Annual cultural dance night.',
    instituteId: 'inst_1',
    clubId: club2._id.toString(),
    createdBy: creatorId,
    venue: 'Open Air Theatre',
    capacity: 1000,
    startsAt: new Date(Date.now() + 86400000 * 14), // in 2 weeks
    endsAt: new Date(Date.now() + 86400000 * 14 + 3600000 * 4),
    status: 'published'
  });

  console.log('Dummy Clubs and Events generated!');
  process.exit(0);
}
run();
