import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing agent profile...');
    
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
    
    // Find the user
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found in database"
      });
    }
    
    console.log('👤 Found user:', {
      id: user._id.toString(),
      name: user.fullName,
      role: user.role,
      hasAgentProfile: !!user.agentProfile
    });
    
    // Check if user already has agent profile
    if (user.agentProfile && Object.keys(user.agentProfile).length > 0) {
      return NextResponse.json({
        success: true,
        message: "User already has agent profile",
        user: {
          id: user._id.toString(),
          name: user.fullName,
          role: user.role,
          agentProfile: user.agentProfile
        }
      });
    }
    
    // Create agent profile for the user
    const agentProfile = {
      licenseNumber: `LIC-${user._id.toString().slice(-8).toUpperCase()}`,
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
        email: user.phone + "@kobac.com",
        phone: user.phone,
        whatsapp: user.phone
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
    user.agentProfile = agentProfile;
    await user.save();
    
    console.log('✅ Agent profile created:', {
      id: user._id.toString(),
      name: user.fullName,
      licenseNumber: agentProfile.licenseNumber,
      verified: agentProfile.verified
    });
    
    return NextResponse.json({
      success: true,
      message: "Agent profile created successfully",
      user: {
        id: user._id.toString(),
        name: user.fullName,
        role: user.role,
        agentProfile: user.agentProfile
      },
      agentProfile: {
        licenseNumber: agentProfile.licenseNumber,
        verified: agentProfile.verified,
        experience: agentProfile.experience,
        specializations: agentProfile.specializations,
        languages: agentProfile.languages,
        areas: agentProfile.areas,
        bio: agentProfile.bio,
        stats: agentProfile.stats
      }
    });
    
  } catch (error) {
    console.error('❌ Fix agent profile error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking agent profile status...');
    
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
    
    // Find the user
    const user = await User.findById(session.userId).select('_id fullName phone role status profile agentProfile');
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found in database"
      });
    }
    
    const hasAgentProfile = user.agentProfile && Object.keys(user.agentProfile).length > 0;
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        hasAgentProfile
      },
      agentProfile: user.agentProfile || null,
      status: {
        hasAgentProfile,
        needsAgentProfile: !hasAgentProfile,
        isAgent: user.role === 'superadmin' || user.role === 'agent'
      },
      action: {
        needed: !hasAgentProfile,
        description: !hasAgentProfile ? 
          'User needs an agent profile to be recognized as an agent' :
          'Agent profile is available'
      }
    });
    
  } catch (error) {
    console.error('❌ Check agent profile status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
