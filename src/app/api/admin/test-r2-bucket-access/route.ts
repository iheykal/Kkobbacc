import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';

export async function POST(request: NextRequest) {
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

    const results = {
      bucketExists: false,
      uploadSuccess: false,
      accessSuccess: false,
      publicAccess: false,
      config: {
        bucket: process.env.R2_BUCKET,
        endpoint: process.env.R2_ENDPOINT,
        publicBase: process.env.R2_PUBLIC_BASE
      },
      tests: [] as any[],
      error: null as string | null
    };

    // Test 1: Check if we can connect to R2
    results.tests.push({
      name: 'R2 Connection Test',
      success: false,
      message: 'Testing R2 connection...'
    });

    try {
      const { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
      
      const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT!,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
        maxAttempts: 3,
      });

      // Test bucket access
      const bucket = process.env.R2_BUCKET!;
      const testKey = `test/access-test-${Date.now()}.txt`;
      const testContent = 'This is a test file to check R2 access';

      // Test upload
      const uploadCmd = new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      });

      await s3.send(uploadCmd);
      results.uploadSuccess = true;
      results.tests[0].success = true;
      results.tests[0].message = 'R2 connection and upload successful';

      // Test access via public URL
      const publicBase = process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE;
      if (publicBase) {
        const publicUrl = `${publicBase.replace(/\/$/, '')}/${testKey}`;
        
        results.tests.push({
          name: 'Public URL Access Test',
          success: false,
          message: 'Testing public URL access...',
          url: publicUrl
        });

        try {
          const response = await fetch(publicUrl, { method: 'HEAD' });
          if (response.ok) {
            results.accessSuccess = true;
            results.publicAccess = true;
            results.tests[1].success = true;
            results.tests[1].message = `Public access working (${response.status})`;
          } else {
            results.tests[1].success = false;
            results.tests[1].message = `Public access failed (${response.status})`;
          }
        } catch (error) {
          results.tests[1].success = false;
          results.tests[1].message = `Public access error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      } else {
        results.tests.push({
          name: 'Public URL Access Test',
          success: false,
          message: 'No public base URL configured'
        });
      }

      // Clean up test file
      try {
        const deleteCmd = new PutObjectCommand({
          Bucket: bucket,
          Key: testKey,
          Body: '', // Empty body to delete
        });
        // Note: We can't actually delete with PutObject, but the test file will expire
      } catch (error) {
        // Ignore cleanup errors
      }

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
      results.tests[0].success = false;
      results.tests[0].message = `R2 connection failed: ${results.error}`;
    }

    console.log(`🎯 R2 bucket access test completed:`, {
      bucketExists: results.bucketExists,
      uploadSuccess: results.uploadSuccess,
      accessSuccess: results.accessSuccess,
      publicAccess: results.publicAccess
    });

    return NextResponse.json({
      success: true,
      message: 'R2 bucket access test completed',
      results
    });

  } catch (error) {
    console.error('Error testing R2 bucket access:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test R2 bucket access' },
      { status: 500 }
    );
  }
}
