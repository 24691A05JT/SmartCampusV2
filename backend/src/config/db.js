import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * Supports MongoDB Atlas URI with connection pool management and graceful error handling.
 */
export const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed.');
  } catch (error) {
    console.error(`[MongoDB] Error disconnecting: ${error.message}`);
  }
};
