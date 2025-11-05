import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { processImageFileSafe } from "@/lib/imageProcessor";
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

import { getR2Endpoint } from '@/lib/getR2Endpoint';

const client = new S3Client({
  region: "auto",
  endpoint: getR2Endpoint(),
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

export async function POST(req: NextRequest) {
  try {
    console.log('👤 Starting agent avatar upload with WebP conversion...');
    
    // Check required environment variables
    const missingEnvVars = [];
    if (!process.env.R2_ENDPOINT) missingEnvVars.push('R2_ENDPOINT');
    if (!process.env.R2_ACCESS_KEY_ID) missingEnvVars.push('R2_ACCESS_KEY_ID');
    if (!process.env.R2_SECRET_ACCESS_KEY) missingEnvVars.push('R2_SECRET_ACCESS_KEY');
    if (!process.env.R2_BUCKET) missingEnvVars.push('R2_BUCKET');
    
    if (missingEnvVars.length > 0) {
      console.error('❌ Missing environment variables:', missingEnvVars);
      return NextResponse.json({ 
        error: `R2 configuration missing: ${missingEnvVars.join(', ')}` 
      }, { status: 500 });
    }

    console.log('✅ Environment variables check passed');

    // Connect to database
    await dbConnect();
    console.log('✅ Database connection established');

    // Check authentication and superadmin role
    const cookie = req.cookies.get('kobac_session')?.value;
    if (!cookie) {
      console.error('❌ No session cookie found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let session: { userId: string; role: string } | null = null;
    try { 
      session = JSON.parse(decodeURIComponent(cookie)); 
      console.log('✅ Session parsed successfully');
    } catch (error) {
      console.error('❌ Session parsing failed:', error);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    if (!session?.userId) {
      console.error('❌ No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 Session user ID:', session.userId);

    // Get user and check if they are superadmin
    const currentUser = await User.findById(session.userId);
    if (!currentUser) {
      console.error('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('👤 User found:', {
      id: currentUser._id,
      name: currentUser.fullName,
      role: currentUser.role
    });

    // Check if this is a superadmin upload for another user
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const agentId = formData.get('agentId') as string;
    const isSuperadminUpload = formData.get('isSuperadminUpload') === 'true';

    if (!file) {
      console.error('❌ No file provided in form data');
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!agentId) {
      console.error('❌ No agent ID provided in form data');
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 });
    }

    // Check authorization - only superadmins can upload avatars
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'super_admin') {
      console.error('❌ Non-superadmin trying to upload avatar');
      return NextResponse.json({ 
        error: 'Only superadmins can upload profile pictures. Please contact the superadmin to change your profile picture.' 
      }, { status: 403 });
    }
    
    // Ensure superadmin can only upload for agents (not for themselves or other superadmins)
    if (currentUser._id.toString() === agentId) {
      console.error('❌ Superadmin trying to upload avatar for themselves');
      return NextResponse.json({ 
        error: 'Superadmins cannot upload their own profile picture through this interface' 
      }, { status: 403 });
    }
    
    console.log('✅ Superadmin upload authorization passed');

    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    console.log('📁 Processing avatar for agent:', agentId);
    console.log('📊 Original file size:', file.size, 'bytes');
    console.log('📋 Original file type:', file.type);

    // Process image to WebP format with fallback
    console.log('🔄 Converting avatar to WebP format...');
    let processedImage;
    try {
      processedImage = await processImageFileSafe(file, {
        quality: 90, // High quality for avatars
        width: 400, // Optimal size for avatars
        height: 400,
        fit: 'cover', // Square crop for avatars
        fallbackToOriginal: false, // Force WebP conversion for avatars
        validateOutput: true
      });
      console.log('✅ Image processing completed');
    } catch (error) {
      console.error('❌ Image processing failed:', error);
      return NextResponse.json({ 
        error: 'Failed to process image' 
      }, { status: 500 });
    }

    // Generate unique key for agent avatar
    const key = `agents/${agentId}/${processedImage.filename}`;
    
    console.log('📤 Uploading processed WebP avatar to R2 with key:', key);

    // Upload processed WebP image to R2
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: processedImage.buffer,
        ContentType: processedImage.contentType,
      });

      await client.send(command);
      console.log('✅ R2 upload completed successfully');
    } catch (error) {
      console.error('❌ R2 upload failed:', error);
      return NextResponse.json({ 
        error: 'Failed to upload to cloud storage' 
      }, { status: 500 });
    }
    
    const publicBase = process.env.R2_PUBLIC_BASE;
    const publicUrl = publicBase ? `${publicBase}/${key}` : `${process.env.R2_PUBLIC_BASE || 'https://pub-36a660b428c343399354263f0c318585.r2.dev'}/${key}`;

    const sizeReduction = ((file.size - processedImage.buffer.length) / file.size * 100).toFixed(1);

    console.log('✅ Avatar WebP upload successful!');
    console.log('🔗 Public URL:', publicUrl);
    console.log('📊 File size reduction:', `${sizeReduction}%`);

    return NextResponse.json({
      success: true,
      key,
      url: publicUrl,
      filename: processedImage.filename,
      size: processedImage.buffer.length,
      type: processedImage.contentType,
      originalName: file.name,
      stats: {
        sizeReduction: `${sizeReduction}%`,
        compressionRatio: (file.size / processedImage.buffer.length).toFixed(2)
      }
    });

  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}


