import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing session after creation...');
    
    // Get current session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No session found - session creation may have failed"
      });
    }
    
    console.log('📋 Session found:', {
      userId: session.userId,
      role: session.role,
      sessionId: session.sessionId
    });
    
    // Connect to database
    await connectDB();
    
    // Find the user in database
    const user = await User.findById(session.userId).select('_id fullName phone role status');
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Session user not found in database",
        session: {
          userId: session.userId,
          role: session.role
        }
      });
    }
    
    console.log('✅ User found in database:', {
      id: user._id.toString(),
      name: user.fullName,
      role: user.role,
      status: user.status
    });
    
    return NextResponse.json({
      success: true,
      message: "Session is working correctly",
      session: {
        userId: session.userId,
        role: session.role,
        sessionId: session.sessionId
      },
      user: {
        id: user._id.toString(),
        name: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status
      },
      verification: {
        sessionExists: true,
        userExistsInDatabase: true,
        sessionUserIdMatchesDatabaseUser: session.userId === user._id.toString(),
        userRole: user.role,
        userStatus: user.status
      }
    });
    
  } catch (error) {
    console.error('❌ Test session after creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
