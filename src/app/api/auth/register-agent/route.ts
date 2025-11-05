import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request: NextRequest) {
  try {
    console.log('👤 Agent registration request received');
    await connectDB();
    
    const body = await request.json();
    const { fullName, phone, password, role = 'agent' } = body;
    
    console.log('📝 Agent registration data:', { fullName, phone, role, password: password ? '***' : 'missing' });
    
    // Validate required fields
    if (!fullName || !phone || !password) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fullName, phone, password' },
        { status: 400 }
      );
    }
    
    // Validate password length (4-6 digits)
    if (!/^\d{4,6}$/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must be 4-6 digits only' },
        { status: 400 }
      );
    }
    
    // Validate phone number format (should start with +252 and have 9 digits after)
    if (!/^\+252\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number (9 digits after +252)' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!['agent', 'agency'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be "agent" or "agency"' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      console.log('❌ User already exists:', phone);
      return NextResponse.json(
        { success: false, error: 'User with this phone number already exists' },
        { status: 409 }
      );
    }
    
    console.log('✅ Creating new agent...');
    
         // Create new agent (avatar will be set after R2 upload)
     const user = new User({
       fullName,
       phone,
       password,
       role,
       status: 'active',
       profile: {
         avatar: '', // Will be set after R2 upload
         location: 'Somalia'
       },
      preferences: {
        favoriteProperties: [],
        searchHistory: [],
        notifications: {
          email: true,
          sms: true,
          push: true,
          propertyUpdates: true,
          marketNews: true,
          promotionalOffers: false
        },
        language: 'en',
        currency: 'USD',
        timezone: 'Africa/Mogadishu'
      },
      security: {
        loginAttempts: 0,
        twoFactorEnabled: false
      }
    });
    
    await user.save();
    console.log('✅ Agent created successfully:', user._id);
    
             // Now upload a proper default agent image to Cloudflare R2
     try {
       console.log('📤 Downloading professional default agent image...');
       console.log('🔧 R2 Environment Check:');
       console.log('  R2_ENDPOINT:', process.env.R2_ENDPOINT ? '✅ Set' : '❌ Missing');
       console.log('  R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
       console.log('  R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
       console.log('  R2_BUCKET:', process.env.R2_BUCKET ? '✅ Set' : '❌ Missing');
       console.log('  R2_PUBLIC_BASE:', process.env.R2_PUBLIC_BASE ? '✅ Set' : '❌ Missing');
       
               // Download a professional default agent image from a reliable source
        // Using a more reliable image URL that won't redirect
        const defaultImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
        console.log('📥 Downloading from:', defaultImageUrl);
       
       const imageResponse = await fetch(defaultImageUrl);
       console.log('📡 Image response status:', imageResponse.status);
       
       if (imageResponse.ok) {
         const imageBuffer = await imageResponse.arrayBuffer();
         console.log('📦 Downloaded image size:', imageBuffer.byteLength, 'bytes');
         
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
         
         // Generate unique filename
         const fileName = `agent-${Date.now()}-${user._id}.jpg`;
         const key = `agents/${user._id}/${fileName}`;
         
         console.log(`📤 Uploading agent image to R2:`);
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
         console.log('✅ R2 upload successful');
         
         // Generate public URL
         const publicUrl = `${process.env.R2_PUBLIC_BASE}/${key}`;
         console.log('🔗 Generated public URL:', publicUrl);
         
         // Update agent's profile with new R2 URL
         await User.findByIdAndUpdate(user._id, {
           'profile.avatar': publicUrl
         });
         
         console.log('✅ Professional default agent image uploaded to Cloudflare R2:', publicUrl);
       } else {
         console.log('⚠️ Could not download default image, using fallback URL');
         // Set a fallback URL
         await User.findByIdAndUpdate(user._id, {
           'profile.avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
         });
       }
     } catch (uploadError) {
       console.error('❌ Failed to upload default agent image to R2:', uploadError);
       console.log('⚠️ Agent created with fallback avatar URL');
       // Set a fallback URL
       await User.findByIdAndUpdate(user._id, {
         'profile.avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
       });
     }
    
    // Return user data (without password)
    const userResponse = {
      id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    };
    
    return NextResponse.json({ 
      success: true, 
      message: 'Agent registered successfully with Cloudflare R2 image',
      data: userResponse
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error during agent registration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register agent' },
      { status: 500 }
    );
  }
}
