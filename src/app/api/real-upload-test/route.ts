import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Real Upload Test: Starting...');
    
    // Check environment variables
    const envCheck = {
      R2_ENDPOINT: process.env.R2_ENDPOINT ? 'SET' : 'NOT SET',
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
      R2_BUCKET: process.env.R2_BUCKET ? 'SET' : 'NOT SET',
      R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL ? 'SET' : 'NOT SET'
    };
    
    console.log('🔍 Real Upload Test: Environment check:', envCheck);
    
    const form = await request.formData();
    const files = form.getAll('files') as File[];
    const listingId = form.get('listingId') as string;
    
    console.log('🔍 Real Upload Test: Form data received:', {
      filesCount: files.length,
      listingId: listingId,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided',
        envCheck: envCheck
      }, { status: 400 });
    }
    
    // Test if we can process the files
    const fileTests = [];
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        fileTests.push({
          name: file.name,
          size: file.size,
          type: file.type,
          bufferSize: buffer.length,
          canProcess: true
        });
      } catch (error) {
        fileTests.push({
          name: file.name,
          size: file.size,
          type: file.type,
          canProcess: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('🔍 Real Upload Test: File processing tests:', fileTests);
    
    // Check if Sharp is available
    let sharpAvailable = false;
    let sharpError = null;
    try {
      const sharp = require('sharp');
      sharpAvailable = true;
      console.log('✅ Sharp library is available');
    } catch (error) {
      sharpAvailable = false;
      sharpError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Sharp library not available:', sharpError);
    }
    
    // Check if AWS SDK is available
    let awsSdkAvailable = false;
    let awsSdkError = null;
    try {
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
      awsSdkAvailable = true;
      console.log('✅ AWS SDK is available');
    } catch (error) {
      awsSdkAvailable = false;
      awsSdkError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ AWS SDK not available:', awsSdkError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        envCheck: envCheck,
        fileTests: fileTests,
        libraries: {
          sharp: {
            available: sharpAvailable,
            error: sharpError
          },
          awsSdk: {
            available: awsSdkAvailable,
            error: awsSdkError
          }
        },
        summary: {
          hasAllEnvVars: Object.values(envCheck).every(v => v === 'SET'),
          canProcessFiles: fileTests.every(t => t.canProcess),
          hasRequiredLibraries: sharpAvailable && awsSdkAvailable
        }
      },
      message: 'Real upload test completed'
    });
    
  } catch (error: any) {
    console.error('❌ Real Upload Test error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Real upload test failed' },
      { status: 500 }
    );
  }
}

