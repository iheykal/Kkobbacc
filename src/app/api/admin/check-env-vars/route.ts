import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only superadmin can access this
    const normalizedRole = session.role === 'super_admin' ? 'superadmin' : session.role;
    
    if (normalizedRole !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint' 
      }, { status: 403 });
    }

    // Check environment variables
    const results = {
      mongodbUri: !!process.env.MONGODB_URI,
      r2Bucket: process.env.R2_BUCKET,
      r2PublicBase: process.env.R2_PUBLIC_BASE,
      r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
      r2Endpoint: process.env.R2_ENDPOINT,
      r2AccessKeyId: !!process.env.R2_ACCESS_KEY_ID,
      r2SecretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
      totalVars: 0,
      allVars: {} as Record<string, any>
    };

    console.log('🔍 Admin check-env-vars - Environment variables:', {
      mongodbUri: results.mongodbUri,
      r2Bucket: results.r2Bucket,
      r2PublicBase: results.r2PublicBase
    });

    // Count total environment variables
    const envVars = [
      'MONGODB_URI',
      'R2_BUCKET',
      'R2_PUBLIC_BASE',
      'R2_PUBLIC_BASE_URL',
      'R2_ENDPOINT',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    envVars.forEach(varName => {
      if (process.env[varName]) {
        results.totalVars++;
        results.allVars[varName] = process.env[varName];
      }
    });

    console.log(`🔍 Environment variables check:`, {
      mongodbUri: results.mongodbUri,
      r2Bucket: results.r2Bucket,
      totalVars: results.totalVars
    });

    return NextResponse.json({
      success: true,
      message: `Environment variables check completed`,
      results
    });

  } catch (error) {
    console.error('Error checking environment variables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check environment variables' },
      { status: 500 }
    );
  }
}
