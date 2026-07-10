import { createApp } from './src/app.js';
import registry from './src/utils/registry.js';
import { connectDB } from './src/database/connection.js';
import mongoose from 'mongoose';

async function test() {
  try {
    await connectDB();
    const app = await createApp(registry);
    console.log('Modules:', Array.from(registry.modules.keys()));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    mongoose.disconnect();
  }
}
test();
