import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/campusos';

const CampaignSchema = new mongoose.Schema(
  {
    title: String,
    formId: mongoose.Schema.Types.ObjectId
  },
  { collection: 'campaigns' }
);
const Campaign =
  mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);

const FormSchema = new mongoose.Schema(
  {
    fields: Array
  },
  { collection: 'forms' }
);
const Form = mongoose.models.Form || mongoose.model('Form', FormSchema);

const FormResponseSchema = new mongoose.Schema(
  {
    formId: mongoose.Schema.Types.ObjectId,
    answers: mongoose.Schema.Types.Mixed
  },
  { collection: 'formresponses' }
);
const FormResponse =
  mongoose.models.FormResponse ||
  mongoose.model('FormResponse', FormResponseSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const campaign = await Campaign.findOne({ title: 'Test' });
  if (!campaign) {
    console.error('Campaign not found');
    process.exit(1);
  }

  const form = await Form.findById(campaign.formId);
  if (!form || !form.fields || form.fields.length === 0) {
    console.error('Form not found or has no fields');
    process.exit(1);
  }

  const responses = await FormResponse.find({ formId: form._id });
  console.log(`Found ${responses.length} responses. Updating...`);

  for (const response of responses) {
    const newAnswers = {};
    for (const field of form.fields) {
      if (field.type === 'text') newAnswers[field.id] = 'Generated text answer';
      else if (field.type === 'textarea')
        newAnswers[field.id] =
          'I am very interested in this opportunity and believe I would be a great fit for the team!';
      else if (field.type === 'email')
        newAnswers[field.id] = 'candidate@example.com';
      else if (field.type === 'number')
        newAnswers[field.id] = Math.floor(Math.random() * 10) + 1;
      else if (field.type === 'select' || field.type === 'radio') {
        if (field.options && field.options.length > 0) {
          newAnswers[field.id] = field.options[0];
        }
      } else if (field.type === 'checkbox') {
        if (field.options && field.options.length > 0) {
          newAnswers[field.id] = [field.options[0]];
        } else {
          newAnswers[field.id] = true;
        }
      }
    }
    response.answers = newAnswers;
    await response.save();
  }

  console.log('Done!');
  process.exit(0);
}

run().catch(console.error);
