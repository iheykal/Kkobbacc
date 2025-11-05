import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return R2 environment variables (without sensitive data)
    const envData = {
      R2_ENDPOINT: process.env.R2_ENDPOINT,
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: process.env.R2_BUCKET,
      R2_PUBLIC_BASE: process.env.R2_PUBLIC_BASE,
      R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL
    };

    return NextResponse.json({
      success: true,
      data: envData
    });

  } catch (error) {
    console.error('Error fetching R2 env data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch R2 environment data' },
      { status: 500 }
    );
  }
}
