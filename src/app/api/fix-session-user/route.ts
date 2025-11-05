import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, setSessionCookie, createSessionPayload } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing session user ID...');
    
    // Get current session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No valid session found"
      });
    }
    
    console.log('📋 Current session userId:', session.userId);
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Find the actual superadmin user in the database
    const actualUser = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role');
    if (!actualUser) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    console.log('👤 Found actual user:', { 
      id: actualUser._id, 
      name: actualUser.fullName, 
      role: actualUser.role 
    });
    
    // Check if the session already has the correct user ID
    if (session.userId === actualUser._id.toString()) {
      return NextResponse.json({
        success: true,
        message: "Session already has correct user ID",
        user: {
          id: actualUser._id,
          fullName: actualUser.fullName,
          role: actualUser.role
        }
      });
    }
    
    // Create new session with correct user ID
    const newSessionPayload = createSessionPayload(actualUser._id.toString(), actualUser.role);
    console.log('🔄 Creating new session with correct user ID:', newSessionPayload);
    
    // Create response with updated session
    const response = NextResponse.json({
      success: true,
      message: "Session user ID fixed successfully",
      oldUserId: session.userId,
      newUserId: actualUser._id.toString(),
      user: {
        id: actualUser._id,
        fullName: actualUser.fullName,
        role: actualUser.role
      }
    });
    
    // Set the new session cookie
    setSessionCookie(response, newSessionPayload, process.env.NODE_ENV === 'production');
    
    console.log('✅ Session cookie updated with correct user ID');
    
    return response;
    
  } catch (error) {
    console.error('❌ Fix session user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking session user ID status...');
    
    // Get current session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No valid session found"
      });
    }
    
    // Connect to database
    await connectDB();
    
    // Find the actual superadmin user in the database
    const actualUser = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role');
    if (!actualUser) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    const isCorrect = session.userId === actualUser._id.toString();
    
    return NextResponse.json({
      success: true,
      sessionUserId: session.userId,
      actualUserId: actualUser._id.toString(),
      isCorrect,
      needsFix: !isCorrect,
      user: {
        id: actualUser._id,
        fullName: actualUser.fullName,
        role: actualUser.role
      }
    });
    
  } catch (error) {
    console.error('❌ Check session user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
