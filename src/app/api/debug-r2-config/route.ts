import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check R2 configuration
    const config = {
      r2Endpoint: process.env.R2_ENDPOINT || null,
      r2Bucket: process.env.R2_BUCKET || null,
      r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL || null,
      r2PublicBase: process.env.R2_PUBLIC_BASE || null,
      hasR2Endpoint: !!process.env.R2_ENDPOINT,
      hasR2Bucket: !!process.env.R2_BUCKET,
      hasR2AccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasR2SecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      hasR2PublicBase: !!(process.env.R2_PUBLIC_BASE || process.env.R2_PUBLIC_BASE_URL),
    };

    return NextResponse.json({
      success: true,
      config
    });
    
  } catch (error: any) {
    console.error('❌ Error checking R2 config:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to check R2 config' },
      { status: 500 }
    );
  }
}
