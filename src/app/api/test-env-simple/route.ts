import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple test without any imports
    const envVars = {
      MONGODB_URI: process.env.MONGODB_URI,
      R2_BUCKET: process.env.R2_BUCKET,
      R2_PUBLIC_BASE: process.env.R2_PUBLIC_BASE,
      NODE_ENV: process.env.NODE_ENV,
      // Get all environment variables
      ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
        key.includes('MONGODB') || key.includes('R2') || key.includes('NODE')
      )
    };

    console.log('🔍 Simple env test - Environment variables:', envVars);

    return NextResponse.json({
      success: true,
      message: 'Simple environment test',
      data: envVars
    });

  } catch (error) {
    console.error('Error in simple env test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test environment' },
      { status: 500 }
    );
  }
}
