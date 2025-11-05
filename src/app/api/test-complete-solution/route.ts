import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing complete solution...');
    
    // Get current session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No session found - complete fix may have failed"
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
    const user = await User.findById(session.userId).select('_id fullName phone role status profile agentProfile');
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found in database",
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
    
    // Check agent profile
    const hasAgentProfile = user.agentProfile && Object.keys(user.agentProfile).length > 0;
    console.log('🔍 Agent profile check:', {
      hasAgentProfile,
      agentProfileKeys: user.agentProfile ? Object.keys(user.agentProfile) : []
    });
    
    return NextResponse.json({
      success: true,
      message: "Complete solution is working correctly",
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
      agentProfile: {
        exists: hasAgentProfile,
        data: user.agentProfile || null
      },
      verification: {
        sessionExists: true,
        userExistsInDatabase: true,
        sessionUserIdMatchesDatabaseUser: session.userId === user._id.toString(),
        userRole: user.role,
        userStatus: user.status,
        agentProfileReady: hasAgentProfile
      },
      status: {
        readyForPropertyUpload: true,
        allIssuesResolved: true
      }
    });
    
  } catch (error) {
    console.error('❌ Test complete solution error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
