// Dynamic import to reduce bundle size
import { getMongoose } from './dynamicImports';

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
  // Skip connection during build phase if MONGODB_URI is not available
  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not available, skipping database connection');
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
    // Dynamically import mongoose
    const mongoose = await getMongoose();
    
    // MongoDB will automatically use the database name from the URI
    // We don't need to specify dbName in options when it's already in the URI
    // This prevents conflicts and errors with database name parsing
    
    const opts = {
      bufferCommands: false,
      // Optimized connection pool settings for Render
      maxPoolSize: 5, // Further reduced for Render free tier
      minPoolSize: 1, // Minimal pool size
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 60000, // Increased socket timeout
      connectTimeoutMS: 30000, // Increased connection timeout
      family: 4, // Use IPv4 only
      maxIdleTimeMS: 300000, // 5 minutes idle time
      heartbeatFrequencyMS: 10000, // Standard heartbeat
      retryWrites: true,
      retryReads: true,
      compressors: 'zlib', // Enable compression
      zlibCompressionLevel: 6, // Fast compression
      // Connection resilience settings
      maxConnecting: 2, // Minimal connecting
      waitQueueTimeoutMS: 30000, // Increased wait timeout
      // Read preferences
      readPreference: 'primary', // Use primary for stability
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