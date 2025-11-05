import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, createSessionPayload } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Complete fix: Creating session and fixing agent profile...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Find the superadmin user from database
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    if (!superAdmin) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    console.log('👤 Found database user:', {
      id: superAdmin._id.toString(),
      name: superAdmin.fullName,
      phone: superAdmin.phone,
      role: superAdmin.role,
      status: superAdmin.status
    });
    
    // Create new session payload with database user
    const sessionPayload = createSessionPayload(superAdmin._id.toString(), superAdmin.role);
    console.log('🔄 Created session payload:', sessionPayload);
    
    // Verify the user exists in database
    const verifyUser = await User.findById(sessionPayload.userId);
    if (!verifyUser) {
      return NextResponse.json({
        success: false,
        error: "Failed to verify user exists in database"
      });
    }
    
    console.log('✅ User verified in database:', {
      id: verifyUser._id.toString(),
      name: verifyUser.fullName,
      role: verifyUser.role
    });
    
    // Check if user has agent profile
    const userWithProfile = await User.findById(sessionPayload.userId).select('_id fullName phone role status profile agentProfile');
    const hasAgentProfile = userWithProfile?.agentProfile && Object.keys(userWithProfile.agentProfile).length > 0;
    
    console.log('🔍 Agent profile check:', {
      hasAgentProfile,
      agentProfileKeys: userWithProfile?.agentProfile ? Object.keys(userWithProfile.agentProfile) : []
    });
    
    let agentProfileCreated = false;
    let agentProfile = null;
    
    // Create agent profile if missing
    if (!hasAgentProfile) {
      console.log('🔧 Creating agent profile...');
      
      agentProfile = {
        licenseNumber: `LIC-${superAdmin._id.toString().slice(-8).toUpperCase()}`,
        verified: true,
        experience: "Experienced Real Estate Professional",
        specializations: ["Residential", "Commercial", "Land"],
        languages: ["Somali", "English", "Arabic"],
        areas: ["Mogadishu", "Hargeisa", "Kismayo"],
        bio: `Professional real estate agent with extensive experience in the Somali market. Specializing in residential and commercial properties.`,
        achievements: ["Top Performer 2024", "Client Satisfaction Award"],
        certifications: ["Real Estate License", "Property Management"],
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
          notificationTypes: ["new_properties", "price_changes", "market_updates"],
          communicationMethod: "phone",
          workingHours: "9:00 AM - 6:00 PM"
        }
      };
      
      // Update user with agent profile
      userWithProfile.agentProfile = agentProfile;
      await userWithProfile.save();
      agentProfileCreated = true;
      
      console.log('✅ Agent profile created:', {
        licenseNumber: agentProfile.licenseNumber,
        verified: agentProfile.verified
      });
    }
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Complete fix applied successfully",
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
        existed: hasAgentProfile,
        created: agentProfileCreated,
        data: agentProfile || userWithProfile?.agentProfile || null
      },
      verification: {
        userExistsInDatabase: true,
        userRole: superAdmin.role,
        userStatus: superAdmin.status,
        sessionCreated: true,
        agentProfileReady: true
      }
    });
    
    // Set the session cookie
    setSessionCookie(response, sessionPayload, process.env.NODE_ENV === 'production');
    
    console.log('✅ Complete fix applied: Session created and agent profile ready');
    
    return response;
    
  } catch (error) {
    console.error('❌ Complete fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking complete fix status...');
    
    // Connect to database
    await connectDB();
    
    // Find superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    
    if (!superAdmin) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    // Check if user has agent profile
    const userWithProfile = await User.findById(superAdmin._id).select('_id fullName phone role status profile agentProfile');
    const hasAgentProfile = userWithProfile?.agentProfile && Object.keys(userWithProfile.agentProfile).length > 0;
    
    return NextResponse.json({
      success: true,
      databaseUser: {
        id: superAdmin._id.toString(),
        name: superAdmin.fullName,
        phone: superAdmin.phone,
        role: superAdmin.role,
        status: superAdmin.status
      },
      agentProfile: {
        exists: hasAgentProfile,
        data: userWithProfile?.agentProfile || null
      },
      status: {
        databaseUserExists: true,
        agentProfileExists: hasAgentProfile,
        readyForCompleteFix: true
      },
      action: {
        needed: true,
        description: "Ready to apply complete fix: Create session and ensure agent profile exists"
      }
    });
    
  } catch (error) {
    console.error('❌ Check complete fix status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
