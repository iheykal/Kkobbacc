import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, createSessionPayload } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('👑 Setting up superadmin as enhanced agent...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Find the superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    if (!superAdmin) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    console.log('👤 Found superadmin:', {
      id: superAdmin._id.toString(),
      name: superAdmin.fullName,
      phone: superAdmin.phone,
      role: superAdmin.role,
      status: superAdmin.status
    });
    
    // Create enhanced agent profile for superadmin
    const enhancedAgentProfile = {
      licenseNumber: `SUPER-${superAdmin._id.toString().slice(-8).toUpperCase()}`,
      verified: true,
      experience: "Senior Real Estate Professional & System Administrator",
      specializations: ["Residential", "Commercial", "Land", "Property Management", "System Administration"],
      languages: ["Somali", "English", "Arabic"],
      areas: ["Mogadishu", "Hargeisa", "Kismayo", "All Regions"],
      bio: `Senior real estate professional with extensive experience in the Somali market. As a superadmin, I have enhanced authority to manage all aspects of the platform including properties, users, and system administration.`,
      achievements: [
        "Top Performer 2024", 
        "Client Satisfaction Award",
        "System Administrator",
        "Platform Manager"
      ],
      certifications: [
        "Real Estate License", 
        "Property Management",
        "System Administration",
        "Platform Management"
      ],
      socialMedia: {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: ""
      },
      contactInfo: {
        email: superAdmin.phone + "@kobac.com",
        phone: superAdmin.phone,
        whatsapp: superAdmin.phone
      },
      stats: {
        totalProperties: 0,
        totalSales: 0,
        totalViews: 0,
        rating: 5.0,
        reviews: 0
      },
      preferences: {
        notificationTypes: ["new_properties", "price_changes", "market_updates", "system_alerts", "user_management"],
        communicationMethod: "phone",
        workingHours: "24/7 - System Administrator"
      },
      // Enhanced authority for superadmin
      authority: {
        level: "superadmin",
        permissions: [
          "create_properties",
          "edit_all_properties", 
          "delete_properties",
          "manage_users",
          "manage_agents",
          "system_administration",
          "view_analytics",
          "manage_settings",
          "approve_properties",
          "manage_roles",
          "platform_management"
        ],
        restrictions: [],
        specialAccess: [
          "all_properties",
          "all_users", 
          "system_settings",
          "analytics_dashboard",
          "admin_panel"
        ]
      }
    };
    
    // Update user with enhanced agent profile
    superAdmin.agentProfile = enhancedAgentProfile;
    await superAdmin.save();
    
    console.log('✅ Enhanced agent profile created for superadmin:', {
      licenseNumber: enhancedAgentProfile.licenseNumber,
      verified: enhancedAgentProfile.verified,
      authorityLevel: enhancedAgentProfile.authority.level,
      permissions: enhancedAgentProfile.authority.permissions.length
    });
    
    // Create session payload
    const sessionPayload = createSessionPayload(superAdmin._id.toString(), superAdmin.role);
    console.log('🔄 Created session payload:', sessionPayload);
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Superadmin set up as enhanced agent successfully",
      session: {
        userId: sessionPayload.userId,
        role: sessionPayload.role,
        sessionId: sessionPayload.sessionId,
        createdAt: sessionPayload.createdAt
      },
      user: {
        id: superAdmin._id.toString(),
        name: superAdmin.fullName,
        phone: superAdmin.phone,
        role: superAdmin.role,
        status: superAdmin.status
      },
      agentProfile: {
        licenseNumber: enhancedAgentProfile.licenseNumber,
        verified: enhancedAgentProfile.verified,
        experience: enhancedAgentProfile.experience,
        specializations: enhancedAgentProfile.specializations,
        authority: enhancedAgentProfile.authority
      },
      authority: {
        level: enhancedAgentProfile.authority.level,
        permissions: enhancedAgentProfile.authority.permissions,
        specialAccess: enhancedAgentProfile.authority.specialAccess
      }
    });
    
    // Set the session cookie
    setSessionCookie(response, sessionPayload, process.env.NODE_ENV === 'production');
    
    console.log('✅ Superadmin agent setup complete');
    
    return response;
    
  } catch (error) {
    console.error('❌ Superadmin as agent error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking superadmin agent status...');
    
    // Connect to database
    await connectDB();
    
    // Find superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status agentProfile');
    
    if (!superAdmin) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    const hasAgentProfile = superAdmin.agentProfile && Object.keys(superAdmin.agentProfile).length > 0;
    const isEnhancedAgent = hasAgentProfile && superAdmin.agentProfile.authority?.level === 'superadmin';
    
    return NextResponse.json({
      success: true,
      superadmin: {
        id: superAdmin._id.toString(),
        name: superAdmin.fullName,
        phone: superAdmin.phone,
        role: superAdmin.role,
        status: superAdmin.status
      },
      agentProfile: {
        exists: hasAgentProfile,
        isEnhanced: isEnhancedAgent,
        data: superAdmin.agentProfile || null
      },
      authority: superAdmin.agentProfile?.authority || null,
      status: {
        isSuperadmin: true,
        isAgent: hasAgentProfile,
        isEnhancedAgent: isEnhancedAgent,
        readyForPropertyUpload: hasAgentProfile
      },
      action: {
        needed: !hasAgentProfile || !isEnhancedAgent,
        description: !hasAgentProfile ? 
          'Superadmin needs agent profile' :
          !isEnhancedAgent ?
          'Superadmin needs enhanced agent profile' :
          'Superadmin is ready as enhanced agent'
      }
    });
    
  } catch (error) {
    console.error('❌ Check superadmin agent status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
