/**
 * HTTP Server Startup
 * Handles server initialization, graceful shutdown, and error handling
 */

import 'dotenv/config';

export function startServer(app, port = 3000) {
  const server = app.listen(port, () => {
    console.log(`\n🚀 CampusOS Backend running on http://localhost:${port}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Ready to handle requests...\n`);
  });

  // ============== GRACEFUL SHUTDOWN ==============

  // Handle termination signals
  const gracefulShutdown = (signal) => {
    console.log(
      `\n📍 Received ${signal} signal, starting graceful shutdown...`
    );

    server.close(() => {
      console.log('✓ HTTP server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('✗ Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  return server;
}

export default startServer;
