/**
 * Backend Entry Point
 * Initializes the Express app and starts the HTTP server
 */

import registry from './utils/registry.js';
import { createApp } from './app.js';
import { startServer } from './server.js';
import { connectDB } from './database/connection.js';

async function main() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create Express app with middleware and loaded plugins
    const app = await createApp(registry);

    // Start HTTP server
    const port = parseInt(process.env.PORT || '4000', 10);
    startServer(app, port);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the main function
main();

export default main;
