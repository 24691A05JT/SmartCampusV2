import mongoose from 'mongoose';

let memoryServerInstance = null;

/**
 * Connect to MongoDB database
 * Supports MongoDB Atlas URI with connection pool management, and automatic local fallback for development/evaluation.
 */
export const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI;

  try {
    if (mongoUri && mongoUri !== 'memory') {
      const conn = await mongoose.connect(mongoUri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 2500
      });
      console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
      return conn;
    }
  } catch (error) {
    console.warn(`[MongoDB] Primary connection to ${mongoUri} failed (${error.message}).`);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.log('[MongoDB] Booting resilient in-memory development database...');
  }

  // Development / Evaluation Fallback: Local In-Memory Database
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
    const memUri = memoryServerInstance.getUri();
    const conn = await mongoose.connect(memUri, { autoIndex: true });
    console.log(`[MongoDB] Connected to resilient local database: ${memUri}`);
    return conn;
  } catch (fallbackError) {
    console.error(`[MongoDB] Failed to boot in-memory database: ${fallbackError.message}`);
    throw fallbackError;
  }
};

export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed.');
    }
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      console.log('[MongoDB] In-memory database stopped.');
    }
  } catch (error) {
    console.error(`[MongoDB] Error disconnecting: ${error.message}`);
  }
};
