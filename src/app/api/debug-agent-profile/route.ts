import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging agent profile...');
    
    // Get current session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No valid session found"
      });
    }
    
    console.log('📋 Session:', { userId: session.userId, role: session.role });
    
    // Connect to database
    await connectDB();
    
    // Find the user with full profile data
    const user = await User.findById(session.userId).select('_id fullName phone role status profile agentProfile createdAt');
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found in database"
      });
    }
    
    console.log('👤 User found:', {
      id: user._id.toString(),
      name: user.fullName,
      role: user.role,
      hasProfile: !!user.profile,
      hasAgentProfile: !!user.agentProfile
    });
    
    // Check profile structure
    const profileData = {
      id: user._id.toString(),
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profile: user.profile || null,
      agentProfile: user.agentProfile || null,
      createdAt: user.createdAt
    };
    
    // Check if user has agent profile
    const hasAgentProfile = user.agentProfile && Object.keys(user.agentProfile).length > 0;
    const hasProfile = user.profile && Object.keys(user.profile).length > 0;
    
    console.log('🔍 Profile analysis:', {
      hasProfile,
      hasAgentProfile,
      profileKeys: user.profile ? Object.keys(user.profile) : [],
      agentProfileKeys: user.agentProfile ? Object.keys(user.agentProfile) : []
    });
    
    return NextResponse.json({
      success: true,
      user: profileData,
      analysis: {
        hasProfile,
        hasAgentProfile,
        profileKeys: user.profile ? Object.keys(user.profile) : [],
        agentProfileKeys: user.agentProfile ? Object.keys(user.agentProfile) : [],
        profileData: user.profile,
        agentProfileData: user.agentProfile
      },
      issues: {
        missingProfile: !hasProfile,
        missingAgentProfile: !hasAgentProfile,
        needsAgentProfile: user.role === 'superadmin' && !hasAgentProfile
      },
      recommendations: {
        action: !hasAgentProfile ? 'Create agent profile' : 'Agent profile exists',
        description: !hasAgentProfile ? 
          'User needs an agent profile to be recognized as an agent' :
          'Agent profile is available'
      }
    });
    
  } catch (error) {
    console.error('❌ Debug agent profile error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
