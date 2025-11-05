import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing R2 configuration...');
    
    // Check environment variables
    const config = {
      R2_ENDPOINT: process.env.R2_ENDPOINT ? '✅ Set' : '❌ Missing',
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
      R2_BUCKET: process.env.R2_BUCKET ? '✅ Set' : '❌ Missing',
      R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL ? '✅ Set' : '❌ Missing',
    };
    
    console.log('📋 R2 Configuration Status:', config);
    
    // Test S3 client creation
    try {
      const [{ S3Client }] = await Promise.all([
        import('@aws-sdk/client-s3'),
      ]);
      
      const { getR2Endpoint } = await import('@/lib/getR2Endpoint')
      const s3 = new S3Client({
        region: 'auto',
        endpoint: getR2Endpoint(),
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
        maxAttempts: 1, // Quick test
      });
      
      console.log('✅ S3 Client created successfully');
      
      // Test bucket access
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET!,
        MaxKeys: 1, // Just test access
      });
      
      await s3.send(listCommand);
      console.log('✅ Bucket access successful');
      
      return NextResponse.json({
        success: true,
        message: 'R2 configuration is working correctly',
        config,
        bucketAccess: '✅ Success'
      });
      
    } catch (s3Error: any) {
      console.error('❌ S3 Client error:', s3Error);
      return NextResponse.json({
        success: false,
        message: 'R2 configuration has issues',
        config,
        error: s3Error.message,
        errorCode: s3Error.code,
        errorName: s3Error.name,
        fullError: s3Error.toString(),
        bucketAccess: '❌ Failed'
      });
    }
    
  } catch (error: any) {
    console.error('❌ Configuration test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
