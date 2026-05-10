/**
 * MongoDB Connection Manager
 * Handles database connection, disconnection, and health checks
 */

import mongoose from 'mongoose';

let isConnected = false;

/**
 * Connect to MongoDB
 * @param {string} uri - MongoDB connection URI
 * @returns {Promise<boolean>} Connection status
 */
export async function connectDB(uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusos') {
  if (isConnected) {
    console.log('MongoDB already connected');
    return true;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error.message);
    throw error;
  }
}

/**
 * Check database health
 * @returns {Promise<boolean>}
 */
export async function healthCheck() {
  try {
    const adminDb = mongoose.connection.getClient().admin();
    const result = await adminDb.ping();
    return result.ok === 1;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

/**
 * Get connection status
 * @returns {boolean}
 */
export function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export default {
  connectDB,
  disconnectDB,
  healthCheck,
  isDBConnected
};
