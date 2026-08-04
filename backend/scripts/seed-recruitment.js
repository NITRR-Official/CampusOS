import mongoose from 'mongoose';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/campusos';

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    passwordHash: String,
    isSuperAdmin: Boolean,
    isActive: Boolean
  },
  { timestamps: true, collection: 'users' }
);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const CampaignSchema = new mongoose.Schema(
  {
    title: String,
    entityType: String,
    entityId: String,
    formId: mongoose.Schema.Types.ObjectId
  },
  { timestamps: true, collection: 'campaigns' }
);
const Campaign =
  mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);

const FormResponseSchema = new mongoose.Schema(
  {
    formId: mongoose.Schema.Types.ObjectId,
    userId: String,
    entityType: String,
    entityId: String,
    answers: mongoose.Schema.Types.Mixed
  },
  { timestamps: true, collection: 'formresponses' }
);
const FormResponse =
  mongoose.models.FormResponse ||
  mongoose.model('FormResponse', FormResponseSchema);

const CandidateSchema = new mongoose.Schema(
  {
    campaignId: mongoose.Schema.Types.ObjectId,
    userId: String,
    responseId: mongoose.Schema.Types.ObjectId,
    status: String,
    notes: String
  },
  { timestamps: true, collection: 'candidates' }
);
const Candidate =
  mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema);

const NAMES = [
  'Alice Smith',
  'Bob Jones',
  'Charlie Brown',
  'Diana Prince',
  'Evan Davis',
  'Fiona Gallagher',
  'George Miller',
  'Hannah Abbott',
  'Ian Wright',
  'Julia Roberts',
  'Kevin Hart',
  'Luna Lovegood',
  'Mike Wheeler',
  'Nancy Drew',
  'Oscar Wilde'
];

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const campaign = await Campaign.findOne({ title: 'Test' });
  if (!campaign) {
    console.error(
      'Could not find Campaign "Test". Please create it in the UI first.'
    );
    process.exit(1);
  }

  console.log('Found campaign:', campaign.title);

  const passwordHash = await hashPassword('password123');
  const statuses = [
    'applied',
    'shortlisted',
    'interview',
    'selected',
    'rejected'
  ];

  let count = 0;
  for (let i = 0; i < 15; i++) {
    const name = NAMES[i];
    const email = `${name.split(' ')[0].toLowerCase()}@example.com`;

    // 1. Create or Find User
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        passwordHash,
        isActive: true,
        isSuperAdmin: false
      });
    }

    // 2. Check if candidate already exists
    let candidate = await Candidate.findOne({
      campaignId: campaign._id,
      userId: user._id.toString()
    });
    if (candidate) {
      console.log(`Candidate ${name} already exists. Skipping.`);
      continue;
    }

    // 3. Create Form Response
    const response = await FormResponse.create({
      formId: campaign.formId,
      userId: user._id.toString(),
      entityType: campaign.entityType,
      entityId: campaign.entityId,
      answers: {
        motivation:
          'I really want to join this club and contribute to its success!',
        experience: 'I have prior experience organizing events.'
      }
    });

    // 4. Create Candidate
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    await Candidate.create({
      campaignId: campaign._id,
      userId: user._id.toString(),
      responseId: response._id,
      status: randomStatus,
      notes: 'Auto-generated test candidate.'
    });

    count++;
    console.log(`Created candidate: ${name} -> ${randomStatus}`);
  }

  console.log(`Successfully seeded ${count} candidates!`);
  process.exit(0);
}

run().catch(console.error);
