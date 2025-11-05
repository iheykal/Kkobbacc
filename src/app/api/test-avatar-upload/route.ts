import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Testing avatar upload configuration...');
    
    // Check environment variables
    const envCheck = {
      R2_ENDPOINT: process.env.R2_ENDPOINT ? '✅ Set' : '❌ Missing',
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
      R2_BUCKET: process.env.R2_BUCKET ? '✅ Set' : '❌ Missing',
      R2_PUBLIC_BASE: process.env.R2_PUBLIC_BASE ? '✅ Set' : '❌ Missing',
    };

    console.log('🔧 Environment variables check:', envCheck);

    // Check authentication
    const cookie = request.cookies.get('kobac_session')?.value;
    let authStatus = '❌ No session cookie';
    let userInfo = null;

    if (cookie) {
      try {
        const session = JSON.parse(decodeURIComponent(cookie));
        if (session?.userId) {
          await dbConnect();
          const user = await User.findById(session.userId);
          if (user) {
            authStatus = `✅ Authenticated as ${user.fullName} (${user.role})`;
            userInfo = {
              id: user._id,
              fullName: user.fullName,
              role: user.role,
              isSuperadmin: user.role === 'superadmin' || user.role === 'super_admin'
            };
          } else {
            authStatus = '❌ User not found in database';
          }
        } else {
          authStatus = '❌ Invalid session data';
        }
      } catch (error) {
        authStatus = '❌ Session parsing error';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar upload configuration test',
      data: {
        environment: envCheck,
        authentication: authStatus,
        user: userInfo,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing avatar upload process...');
    
    // Check authentication first
    const cookie = request.cookies.get('kobac_session')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'No session cookie' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(decodeURIComponent(cookie));
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (!session?.userId) {
      return NextResponse.json({ error: 'No user ID in session' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is superadmin
    const isSuperadmin = user.role === 'superadmin' || user.role === 'super_admin';
    if (!isSuperadmin) {
      return NextResponse.json({ 
        error: 'Only superadmins can upload avatars',
        userRole: user.role
      }, { status: 403 });
    }

    // Test file upload
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('📁 Test file details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Test environment variables
    const missingEnvVars = [];
    if (!process.env.R2_ENDPOINT) missingEnvVars.push('R2_ENDPOINT');
    if (!process.env.R2_ACCESS_KEY_ID) missingEnvVars.push('R2_ACCESS_KEY_ID');
    if (!process.env.R2_SECRET_ACCESS_KEY) missingEnvVars.push('R2_SECRET_ACCESS_KEY');
    if (!process.env.R2_BUCKET) missingEnvVars.push('R2_BUCKET');

    if (missingEnvVars.length > 0) {
      return NextResponse.json({
        error: 'Missing environment variables',
        missing: missingEnvVars
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar upload test passed',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          role: user.role,
          isSuperadmin
        },
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        environment: '✅ All required environment variables are set',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Test upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
