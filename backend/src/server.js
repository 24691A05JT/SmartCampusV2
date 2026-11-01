import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { seedInitialAdmin } from './utils/seedAdmin.js';

const PORT = process.env.PORT || 5000;

// Start Server with Database Connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Bootstrap initial admin account if not present
    await seedInitialAdmin();

    const server = app.listen(PORT, () => {
      console.log(`[SmartCampus Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`[Health Probe] Available at http://localhost:${PORT}/api/health`);
    });

    // Graceful Shutdown
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Process terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error(`[Server Boot Error]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
