import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, createSessionPayload } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creating new session with database user...');
    
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
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "New session created with database user",
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
      verification: {
        userExistsInDatabase: true,
        userRole: superAdmin.role,
        userStatus: superAdmin.status,
        sessionCreated: true
      }
    });
    
    // Set the session cookie
    setSessionCookie(response, sessionPayload, process.env.NODE_ENV === 'production');
    
    console.log('✅ Session cookie set with database user');
    
    return response;
    
  } catch (error) {
    console.error('❌ Create session with database user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking session creation status...');
    
    // Connect to database
    await connectDB();
    
    // Find superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    
    return NextResponse.json({
      success: true,
      databaseUser: superAdmin ? {
        id: superAdmin._id.toString(),
        name: superAdmin.fullName,
        phone: superAdmin.phone,
        role: superAdmin.role,
        status: superAdmin.status
      } : null,
      status: {
        databaseUserExists: !!superAdmin,
        readyToCreateSession: !!superAdmin
      },
      action: {
        needed: !superAdmin,
        description: !superAdmin ? 
          'No superadmin user found in database - cannot create session' :
          'Ready to create session with database user'
      }
    });
    
  } catch (error) {
    console.error('❌ Check session creation status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
