import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Backend server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`📚 API Documentation: http://localhost:${env.PORT}/api/v1/docs`);
      console.log(`🩺 Health Check: http://localhost:${env.PORT}/api/v1/health/ready`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        await disconnectDatabase();
        console.log('MongoDB disconnected. Exiting process.');
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
