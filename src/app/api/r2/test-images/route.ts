import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getR2Endpoint } from '@/lib/getR2Endpoint';

// Node runtime is required for AWS SDK
export const runtime = 'nodejs';

const client = new S3Client({
  region: "auto",
  endpoint: getR2Endpoint(),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
  maxAttempts: 3,
});

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Testing R2 image accessibility...');
    console.log('🔧 R2_PUBLIC_BASE:', process.env.R2_PUBLIC_BASE);
    console.log('🔧 R2_BUCKET:', process.env.R2_BUCKET);
    
    if (!process.env.R2_BUCKET || !process.env.R2_PUBLIC_BASE) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing R2_BUCKET or R2_PUBLIC_BASE environment variables"
      }, { status: 500 });
    }

    // List all objects in the bucket
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
      MaxKeys: 10,
    });

    const result = await client.send(command);
    
    const images = result.Contents?.map(obj => {
      const publicUrl = `${process.env.R2_PUBLIC_BASE}/${obj.Key}`;
      return {
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        publicUrl: publicUrl,
        directUrl: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${obj.Key}`
      };
    }) || [];

    // Test accessibility of first few images
    const accessibilityTests = [];
    for (const image of images.slice(0, 3)) {
      try {
        const response = await fetch(image.publicUrl, { method: 'HEAD' });
        accessibilityTests.push({
          image: image.key,
          publicUrl: image.publicUrl,
          accessible: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type')
        });
      } catch (error) {
        accessibilityTests.push({
          image: image.key,
          publicUrl: image.publicUrl,
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      bucket: process.env.R2_BUCKET,
      publicBase: process.env.R2_PUBLIC_BASE,
      totalObjects: result.KeyCount || 0,
      images: images,
      accessibilityTests: accessibilityTests,
      samplePublicUrl: images.length > 0 ? images[0].publicUrl : null
    });

  } catch (error) {
    console.error('❌ R2 image test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
