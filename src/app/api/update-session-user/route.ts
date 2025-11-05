import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, setSessionCookie, createSessionPayload } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Updating session to use correct user ID...');
    
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
    
    // Find the actual superadmin user
    const actualUser = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    if (!actualUser) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    console.log('👤 Found actual user:', { 
      id: actualUser._id.toString(), 
      name: actualUser.fullName, 
      role: actualUser.role 
    });
    
    // Create new session with correct user ID
    const newSessionPayload = createSessionPayload(actualUser._id.toString(), actualUser.role);
    console.log('🔄 Creating new session payload:', newSessionPayload);
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Session updated successfully",
      oldSession: {
        userId: session.userId,
        role: session.role
      },
      newSession: {
        userId: newSessionPayload.userId,
        role: newSessionPayload.role,
        sessionId: newSessionPayload.sessionId
      },
      user: {
        id: actualUser._id.toString(),
        fullName: actualUser.fullName,
        phone: actualUser.phone,
        role: actualUser.role,
        status: actualUser.status
      }
    });
    
    // Set the new session cookie
    setSessionCookie(response, newSessionPayload, process.env.NODE_ENV === 'production');
    
    console.log('✅ Session cookie updated successfully');
    
    return response;
    
  } catch (error) {
    console.error('❌ Update session error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking session status...');
    
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
    
    // Find the actual superadmin user
    const actualUser = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    if (!actualUser) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    const isCorrect = session.userId === actualUser._id.toString();
    
    return NextResponse.json({
      success: true,
      sessionStatus: {
        currentUserId: session.userId,
        actualUserId: actualUser._id.toString(),
        isCorrect,
        needsUpdate: !isCorrect
      },
      user: {
        id: actualUser._id.toString(),
        fullName: actualUser.fullName,
        phone: actualUser.phone,
        role: actualUser.role,
        status: actualUser.status
      }
    });
    
  } catch (error) {
    console.error('❌ Check session status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
