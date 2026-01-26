// Dynamic import to reduce bundle size
// import { getMongoose } from './dynamicImports'; // REMOVED to avoid circular dependency with sharp

const MONGODB_URI = process.env.MONGODB_URI;

// Only throw error during development, not during build or production
if (!MONGODB_URI && process.env.NODE_ENV === 'development' && !process.env.NEXT_PHASE) {
  console.warn('⚠️ MONGODB_URI not defined in development environment');
}

declare global {
  var mongoose: any;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Skip connection during build phase if MONGODB_URI is not available or is dummy
  if (!MONGODB_URI || MONGODB_URI.includes('dummy')) {
    console.warn('⚠️ MONGODB_URI not available or dummy, skipping database connection');
    return null;
  }

  // Log connection attempt (mask sensitive info)
  const maskedUri = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log('🔌 Attempting MongoDB connection to:', maskedUri);

  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    // Dynamically import mongoose directly here to avoid importing 'sharp' via dynamicImports.ts
    const mongoose = (await import('mongoose')).default;

    // MongoDB will automatically use the database name from the URI
    // We don't need to specify dbName in options when it's already in the URI
    // This prevents conflicts and errors with database name parsing

    const opts = {
      bufferCommands: false,
      // Optimized connection pool settings for Render (Serverless)
      // Increased maxPoolSize to 10 to allow parallel requests (e.g. prefetching + navigation)
      // This prevents the "single-file line" bottleneck where one slow request blocks all others
      maxPoolSize: 10,
      minPoolSize: 0, // Allow pool to scale down to 0
      serverSelectionTimeoutMS: 60000, // Further increased to 60s
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000, // Increased to 60s
      family: 4,
      maxIdleTimeMS: 60000, // Reduced idle time to free connections faster
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      compressors: 'zlib',
      zlibCompressionLevel: 6 as any,
      // Connection resilience settings
      maxConnecting: 1, // Only 1 connection at a time
      waitQueueTimeoutMS: 60000, // Increased wait timeout
      // Read preferences
      readPreference: 'primary' as any, // Use primary for stability
      // Additional stability settings
      directConnection: false,
      // Note: maxStalenessSeconds cannot be used with primary read preference
      // Connection monitoring
      monitorCommands: false,
      // Note: serverSelectionRetryDelayMS is not supported in current MongoDB driver
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance: any) => {
      console.log('✅ Connected to MongoDB with optimized settings');

      // Ensure connection is fully ready (important when bufferCommands: false)
      // Wait until readyState is 1 (connected)
      if (mongooseInstance.connection.readyState !== 1) {
        await new Promise<void>((resolve, reject) => {
          // Check if already connected
          if (mongooseInstance.connection.readyState === 1) {
            resolve();
            return;
          }

          let timeoutId: NodeJS.Timeout | null = null;

          const cleanup = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            mongooseInstance.connection.removeListener('connected', onConnected);
            mongooseInstance.connection.removeListener('error', onError);
          };

          const onConnected = () => {
            console.log('✅ MongoDB connection confirmed ready');
            cleanup();
            resolve();
          };

          const onError = (error: any) => {
            cleanup();
            reject(error);
          };

          mongooseInstance.connection.once('connected', onConnected);
          mongooseInstance.connection.once('error', onError);

          // Timeout after 10 seconds
          timeoutId = setTimeout(() => {
            if (mongooseInstance.connection.readyState !== 1) {
              cleanup();
              reject(new Error('MongoDB connection timeout'));
            }
          }, 10000);
        });
      }

      return mongooseInstance;
    }).catch((error: any) => {
      console.error('❌ MongoDB connection failed:', error);
      cached.promise = null; // Reset promise on failure
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;

    // Double-check connection is ready before returning
    if (cached.conn.connection && cached.conn.connection.readyState !== 1) {
      console.log('⏳ Waiting for connection to be fully ready...');
      await new Promise<void>((resolve, reject) => {
        // Check if already connected
        if (cached.conn.connection.readyState === 1) {
          resolve();
          return;
        }

        let timeoutId: NodeJS.Timeout | null = null;

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          cached.conn.connection.removeListener('connected', onConnected);
          cached.conn.connection.removeListener('error', onError);
        };

        const onConnected = () => {
          cleanup();
          resolve();
        };

        const onError = (error: any) => {
          cleanup();
          reject(error);
        };

        cached.conn.connection.once('connected', onConnected);
        cached.conn.connection.once('error', onError);

        // Timeout after 5 seconds
        timeoutId = setTimeout(() => {
          if (cached.conn.connection.readyState !== 1) {
            cleanup();
            reject(new Error('MongoDB connection timeout'));
          }
        }, 5000);
      });
    }
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
export { connectDB as connectToDatabase };