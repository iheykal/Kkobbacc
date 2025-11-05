import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔧 Testing R2 Environment Variables...');
    
    const envVars = {
      R2_ENDPOINT: process.env.R2_ENDPOINT ? '✅ Set' : '❌ Missing',
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
      R2_BUCKET: process.env.R2_BUCKET ? '✅ Set' : '❌ Missing',
      R2_PUBLIC_BASE: process.env.R2_PUBLIC_BASE ? '✅ Set' : '❌ Missing',
    };

    console.log('Environment variables status:', envVars);

    // Check if all required variables are set
    const missingVars = Object.entries(envVars)
      .filter(([key, status]) => status === '❌ Missing' && key !== 'R2_PUBLIC_BASE')
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing R2 environment variables: ${missingVars.join(', ')}`,
        envVars
      });
    }

    return NextResponse.json({
      success: true,
      message: 'R2 environment variables are properly configured',
      envVars
    });

  } catch (error) {
    console.error('❌ Error testing R2 status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test R2 status'
    }, { status: 500 });
  }
}
