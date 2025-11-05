import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DEFAULT_AVATAR_URL } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing agent image download and upload...');
    
    // Test multiple image URLs to see which one is correct
    const imageUrls = [
      DEFAULT_AVATAR_URL,
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
    ];
    
    const results = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`📥 Testing image ${i + 1}:`, imageUrl);
      
      try {
        const imageResponse = await fetch(imageUrl);
        console.log(`📡 Image ${i + 1} response status:`, imageResponse.status);
        
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          console.log(`📦 Image ${i + 1} size:`, imageBuffer.byteLength, 'bytes');
          
          // Create R2 client
          const client = new S3Client({
            region: "auto",
            endpoint: process.env.R2_ENDPOINT!,
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID!,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
            forcePathStyle: true,
            maxAttempts: 3,
            requestHandler: {
              httpOptions: {
                timeout: 30000,
              },
            },
          });
          
          // Generate unique filename for testing
          const fileName = `test-agent-image-${i + 1}-${Date.now()}.jpg`;
          const key = `test-uploads/${fileName}`;
          
          console.log(`📤 Uploading test image ${i + 1} to R2:`);
          console.log(`  Bucket: ${process.env.R2_BUCKET}`);
          console.log(`  Key: ${key}`);
          console.log(`  Size: ${imageBuffer.byteLength} bytes`);
          
          // Upload to R2
          const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: Buffer.from(imageBuffer),
            ContentType: 'image/jpeg',
          });
          
          await client.send(command);
          console.log(`✅ R2 upload successful for image ${i + 1}`);
          
          // Generate public URL
          const publicUrl = `${process.env.R2_PUBLIC_BASE}/${key}`;
          console.log(`🔗 Generated public URL for image ${i + 1}:`, publicUrl);
          
          results.push({
            imageNumber: i + 1,
            originalUrl: imageUrl,
            uploadedUrl: publicUrl,
            key: key,
            size: imageBuffer.byteLength,
            status: 'success'
          });
          
        } else {
          results.push({
            imageNumber: i + 1,
            originalUrl: imageUrl,
            status: 'failed',
            error: `HTTP ${imageResponse.status}: ${imageResponse.statusText}`
          });
        }
      } catch (error) {
        results.push({
          imageNumber: i + 1,
          originalUrl: imageUrl,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Multiple agent images tested',
      data: {
        results,
        totalTested: imageUrls.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status !== 'success').length
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        R2_ENDPOINT: process.env.R2_ENDPOINT,
        R2_BUCKET: process.env.R2_BUCKET,
        R2_PUBLIC_BASE: process.env.R2_PUBLIC_BASE
      }
    }, { status: 500 });
  }
}
