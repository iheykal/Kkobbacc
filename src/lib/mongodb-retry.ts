import connectDB from './mongodb';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export async function connectWithRetry(): Promise<any> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 MongoDB connection attempt ${attempt}/${MAX_RETRIES}`);
      const connection = await connectDB();
      console.log(`✅ MongoDB connected successfully on attempt ${attempt}`);
      return connection;
    } catch (error) {
      lastError = error;
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Waiting ${RETRY_DELAY}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }
  
  console.error(`❌ All ${MAX_RETRIES} MongoDB connection attempts failed`);
  throw lastError;
}

export default connectWithRetry;
