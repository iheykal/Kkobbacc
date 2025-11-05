import connectDB from './mongodb';

/**
 * Safely connects to the database and returns a connection or null
 * This function handles the case where MONGODB_URI is not available during build time
 */
export async function safeConnectDB() {
  try {
    const connection = await connectDB();
    return connection;
  } catch (error) {
    console.warn('⚠️ Database connection failed:', error);
    return null;
  }
}

/**
 * Checks if database connection is available
 * Returns true if connected, false otherwise
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  const connection = await safeConnectDB();
  return connection !== null;
}
