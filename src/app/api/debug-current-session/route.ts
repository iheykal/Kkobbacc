import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging current session state...');
    
    // Get current session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No valid session found"
      });
    }
    
    console.log('📋 Current session:', session);
    
    // Connect to database
    await connectDB();
    
    // Find the actual superadmin user
    const actualUser = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role');
    
    // Try to find user with session ID
    const sessionUser = await User.findById(session.userId);
    
    return NextResponse.json({
      success: true,
      session: {
        userId: session.userId,
        role: session.role,
        sessionId: session.sessionId
      },
      actualUser: actualUser ? {
        id: actualUser._id.toString(),
        fullName: actualUser.fullName,
        role: actualUser.role
      } : null,
      sessionUser: sessionUser ? {
        id: sessionUser._id.toString(),
        fullName: sessionUser.fullName,
        role: sessionUser.role
      } : null,
      analysis: {
        sessionUserIdExists: !!sessionUser,
        actualUserExists: !!actualUser,
        idsMatch: session.userId === actualUser?._id.toString(),
        needsFix: !sessionUser && !!actualUser
      }
    });
    
  } catch (error) {
    console.error('❌ Debug current session error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
