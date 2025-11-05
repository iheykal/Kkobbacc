import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

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

    // Get R2 configuration
    const bucket = process.env.R2_BUCKET;
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const publicBase = process.env.R2_PUBLIC_BASE;
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

    console.log('🔍 Testing R2 bucket configuration...');

    const results = {
      bucket,
      endpoint,
      publicBase,
      publicBaseUrl,
      bucketAccess: false,
      customDomainWorking: false,
      uploadTest: false,
      errors: [] as string[]
    };

    // Test 1: Check if we can access R2
    try {
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: endpoint,
        credentials: {
          accessKeyId: accessKeyId!,
          secretAccessKey: secretAccessKey!,
        },
      });

      // List buckets to test connectivity
      const listBucketsCommand = new ListBucketsCommand({});
      const listBucketsResponse = await s3Client.send(listBucketsCommand);
      
      const bucketExists = listBucketsResponse.Buckets?.some(b => b.Name === bucket);
      
      if (bucketExists) {
        results.bucketAccess = true;
        console.log('✅ Bucket access confirmed');
      } else {
        results.errors.push(`Bucket '${bucket}' not found in your R2 account`);
        console.log('❌ Bucket not found');
      }
    } catch (error) {
      results.errors.push(`R2 access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ R2 access error:', error);
    }

    // Test 2: Test custom domain
    if (publicBaseUrl) {
      try {
        const testUrl = `${publicBaseUrl}/test-file.txt`;
        const response = await fetch(testUrl, { method: 'HEAD' });
        
        if (response.ok) {
          results.customDomainWorking = true;
          console.log('✅ Custom domain working');
        } else {
          results.errors.push(`Custom domain not accessible: ${response.status} ${response.statusText}`);
          console.log('❌ Custom domain not accessible');
        }
      } catch (error) {
        results.errors.push(`Custom domain error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('❌ Custom domain error:', error);
      }
    }

    // Test 3: Test upload (if bucket access works)
    if (results.bucketAccess) {
      try {
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: endpoint,
          credentials: {
            accessKeyId: accessKeyId!,
            secretAccessKey: secretAccessKey!,
          },
        });

        const testKey = `test-${Date.now()}.txt`;
        const testContent = 'This is a test file';

        const putObjectCommand = new PutObjectCommand({
          Bucket: bucket,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain',
        });

        await s3Client.send(putObjectCommand);
        results.uploadTest = true;
        console.log('✅ Upload test successful');

        // Clean up test file
        try {
          // Note: DeleteObjectCommand would be needed here, but we'll leave the test file for now
        } catch (cleanupError) {
          console.log('⚠️ Could not clean up test file');
        }
      } catch (error) {
        results.errors.push(`Upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('❌ Upload test failed:', error);
      }
    }

    console.log(`📊 R2 bucket test completed: Access=${results.bucketAccess}, Domain=${results.customDomainWorking}, Upload=${results.uploadTest}`);

    return NextResponse.json({
      success: true,
      message: 'R2 bucket test completed',
      ...results
    });

  } catch (error) {
    console.error('Error testing R2 bucket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test R2 bucket' },
      { status: 500 }
    );
  }
}
