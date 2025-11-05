import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    // Get all environment variables for debugging
    const allEnvVars = {
      MONGODB_URI: process.env.MONGODB_URI,
      R2_BUCKET: process.env.R2_BUCKET,
      R2_PUBLIC_BASE: process.env.R2_PUBLIC_BASE,
      NODE_ENV: process.env.NODE_ENV,
      // Get all environment variables that contain MONGODB or R2
      ALL_MONGODB_R2_VARS: Object.keys(process.env).filter(key => 
        key.includes('MONGODB') || key.includes('R2')
      ).reduce((acc, key) => {
        acc[key] = process.env[key];
        return acc;
      }, {} as Record<string, string | undefined>)
    };

    console.log('🔍 Direct MongoDB test - All environment variables:', allEnvVars);

    const results = {
      envVar: !!process.env.MONGODB_URI,
      connection: false,
      database: false,
      collection: false,
      totalProperties: 0,
      error: null as string | null,
      debugEnvVars: allEnvVars
    };

    // Test connection
    if (!process.env.MONGODB_URI) {
      results.error = 'MONGODB_URI environment variable is not set';
      return NextResponse.json({
        success: false,
        message: 'Environment variable missing',
        results
      });
    }

    try {
      const db = await connectToDatabase();
      if (db) {
        results.connection = true;
        results.database = true;
        
        // Test collection
        const count = await Property.countDocuments({});
        results.collection = true;
        results.totalProperties = count;
        
        console.log('✅ Direct MongoDB test successful:', results);
      }
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Direct MongoDB test failed:', error);
    }

    return NextResponse.json({
      success: results.connection && results.database && results.collection,
      message: 'Direct MongoDB test completed',
      results
    });

  } catch (error) {
    console.error('Error in direct MongoDB test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test MongoDB' },
      { status: 500 }
    );
  }
}
