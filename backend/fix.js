import mongoose from 'mongoose';
import { Plugin } from './src/database/schemas/plugin.schema.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function fix() {
  await mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/campusos'
  );
  await Plugin.updateMany({}, { enabled: true });
  console.log('Fixed plugins in DB to true');
  process.exit(0);
}
fix();
