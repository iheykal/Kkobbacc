import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get all environment variables that start with MONGODB or R2
    const envVars = {
      MONGODB_URI: process.env.MONGODB_URI,
      R2_BUCKET: process.env.R2_BUCKET,
      R2_PUBLIC_BASE: process.env.R2_PUBLIC_BASE,
      R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
      R2_ENDPOINT: process.env.R2_ENDPOINT,
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
      NODE_ENV: process.env.NODE_ENV,
      // Get all environment variables for debugging
      ALL_ENV_VARS: Object.keys(process.env).filter(key => 
        key.includes('MONGODB') || 
        key.includes('R2') || 
        key.includes('NODE')
      ).reduce((acc, key) => {
        acc[key] = process.env[key];
        return acc;
      }, {} as Record<string, string | undefined>)
    };

    console.log('🔍 Environment variables check:', envVars);

    return NextResponse.json({
      success: true,
      message: 'Environment variables check',
      data: envVars
    });

  } catch (error) {
    console.error('Error checking environment variables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check environment variables' },
      { status: 500 }
    );
  }
}
