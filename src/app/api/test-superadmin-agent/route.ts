import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing superadmin agent functionality...');
    
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
    const user = await User.findById(session.userId).select('_id fullName phone role status profile agentProfile');
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
      status: user.status
    });
    
    // Check agent profile
    const hasAgentProfile = user.agentProfile && Object.keys(user.agentProfile).length > 0;
    const isEnhancedAgent = hasAgentProfile && user.agentProfile.authority?.level === 'superadmin';
    
    console.log('🔍 Agent profile analysis:', {
      hasAgentProfile,
      isEnhancedAgent,
      authorityLevel: user.agentProfile?.authority?.level || 'none'
    });
    
    // Check permissions
    const permissions = user.agentProfile?.authority?.permissions || [];
    const specialAccess = user.agentProfile?.authority?.specialAccess || [];
    
    return NextResponse.json({
      success: true,
      message: "Superadmin agent functionality test completed",
      user: {
        id: user._id.toString(),
        name: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status
      },
      agentProfile: {
        exists: hasAgentProfile,
        isEnhanced: isEnhancedAgent,
        licenseNumber: user.agentProfile?.licenseNumber || null,
        verified: user.agentProfile?.verified || false,
        experience: user.agentProfile?.experience || null
      },
      authority: {
        level: user.agentProfile?.authority?.level || 'none',
        permissions: permissions,
        specialAccess: specialAccess,
        totalPermissions: permissions.length
      },
      functionality: {
        canCreateProperties: true, // Superadmin can always create properties
        canEditAllProperties: permissions.includes('edit_all_properties'),
        canDeleteProperties: permissions.includes('delete_properties'),
        canManageUsers: permissions.includes('manage_users'),
        canManageAgents: permissions.includes('manage_agents'),
        canSystemAdmin: permissions.includes('system_administration'),
        canViewAnalytics: permissions.includes('view_analytics'),
        canManageSettings: permissions.includes('manage_settings')
      },
      status: {
        isSuperadmin: user.role === 'superadmin',
        isAgent: hasAgentProfile,
        isEnhancedAgent: isEnhancedAgent,
        readyForPropertyUpload: true,
        hasFullAuthority: isEnhancedAgent
      }
    });
    
  } catch (error) {
    console.error('❌ Test superadmin agent error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
