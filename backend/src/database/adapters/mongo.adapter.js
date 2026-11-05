/**
 * MongoDB Database Adapter
 * Implements DatabaseAdapter interface for MongoDB using Mongoose.
 */

import mongoose from 'mongoose';
import { DatabaseAdapter } from './base.adapter.js';

export class MongoAdapter extends DatabaseAdapter {
  #connected = false;

  constructor() {
    super('mongodb');

    // Suppress deprecation warnings and ensure consistent queries
    mongoose.set('strictQuery', true);

    // Listen to native driver events to prevent state drift
    mongoose.connection.on('disconnected', () => {
      this.#connected = false;
      console.warn('⚠️ MongoDB lost connection!');
    });

    mongoose.connection.on('reconnected', () => {
      this.#connected = true;
      console.log('✅ MongoDB reconnected');
    });
  }

  /**
   * Connect to MongoDB
   * @param {Object} [config]
   * @returns {Promise<boolean>}
   */
  async connect(config = {}) {
    if (this.isConnected()) {
      console.log('MongoDB already connected');
      return true;
    }

    const uri =
      config.uri ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/campusos';

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      ...config.options
    };

    try {
      await mongoose.connect(uri, options);
      this.#connected = true;
      console.log('✅ MongoDB connected successfully');
      return true;
    } catch (error) {
      this.#connected = false;
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.#connected && mongoose.connection.readyState === 0) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.#connected = false;
      console.log('✅ MongoDB disconnected');
    } catch (error) {
      console.error('❌ MongoDB disconnection failed:', error.message);
      throw error;
    }
  }

  /**
   * Check connection status
   * @returns {boolean}
   */
  isConnected() {
    return this.#connected && mongoose.connection.readyState === 1;
  }

  /**
   * Ping database and measure latency
   * @returns {Promise<{ healthy: boolean, status: string, latencyMs: number, error?: string }>}
   */
  async healthCheck() {
    const start = Date.now();
    try {
      const adminDb = mongoose.connection.getClient().admin();
      const result = await adminDb.ping();
      const latencyMs = Date.now() - start;
      const isHealthy = result.ok === 1;

      return {
        healthy: isHealthy,
        status: isHealthy ? 'connected' : 'disconnected',
        latencyMs
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'disconnected',
        latencyMs: Date.now() - start,
        error: error.message
      };
    }
  }

  /**
   * Return Mongoose instance
   * @returns {typeof mongoose}
   */
  getClient() {
    return mongoose;
  }
}

export default MongoAdapter;
