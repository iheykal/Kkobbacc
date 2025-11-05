import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, setSessionCookie, createSessionPayload } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Finding and using the actual database user...');
    
    // Connect to database first
    await connectDB();
    console.log('✅ Database connected');
    
    // Find the actual user from MongoDB (not hardcoded)
    console.log('🔍 Searching for users in database...');
    const allUsers = await User.find({}).select('_id fullName phone role status createdAt');
    console.log('📊 Total users found in database:', allUsers.length);
    
    if (allUsers.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No users found in database"
      });
    }
    
    // Find the superadmin user from database
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    if (!superAdmin) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database",
        availableUsers: allUsers.map(u => ({
          id: u._id.toString(),
          name: u.fullName,
          role: u.role,
          status: u.status
        }))
      });
    }
    
    console.log('👤 Found superadmin user in database:', {
      id: superAdmin._id.toString(),
      name: superAdmin.fullName,
      phone: superAdmin.phone,
      role: superAdmin.role,
      status: superAdmin.status
    });
    
    // Get current session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No valid session found"
      });
    }
    
    console.log('📋 Current session userId:', session.userId);
    
    // Create new session with the actual database user ID
    const newSessionPayload = createSessionPayload(superAdmin._id.toString(), superAdmin.role);
    console.log('🔄 Creating new session with database user ID:', newSessionPayload);
    
    // Verify the new session user exists in database
    const verifyUser = await User.findById(newSessionPayload.userId);
    if (!verifyUser) {
      return NextResponse.json({
        success: false,
        error: "Failed to verify user exists in database"
      });
    }
    
    console.log('✅ Verified user exists in database:', {
      id: verifyUser._id.toString(),
      name: verifyUser.fullName,
      role: verifyUser.role
    });
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Session updated to use actual database user",
      databaseUser: {
        id: superAdmin._id.toString(),
        name: superAdmin.fullName,
        phone: superAdmin.phone,
        role: superAdmin.role,
        status: superAdmin.status,
        createdAt: superAdmin.createdAt
      },
      sessionUpdate: {
        oldUserId: session.userId,
        newUserId: superAdmin._id.toString(),
        updated: true
      },
      verification: {
        userExistsInDatabase: true,
        userRole: superAdmin.role,
        userStatus: superAdmin.status
      }
    });
    
    // Set the new session cookie with the database user
    setSessionCookie(response, newSessionPayload, process.env.NODE_ENV === 'production');
    
    console.log('✅ Session cookie updated with database user ID');
    
    return response;
    
  } catch (error) {
    console.error('❌ Use database user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database user status...');
    
    // Connect to database
    await connectDB();
    
    // Find all users in database
    const allUsers = await User.find({}).select('_id fullName phone role status createdAt');
    console.log('📊 Total users in database:', allUsers.length);
    
    // Find superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    
    // Get current session
    const session = getSessionFromRequest(request);
    
    return NextResponse.json({
      success: true,
      database: {
        totalUsers: allUsers.length,
        superAdminExists: !!superAdmin,
        allUsers: allUsers.map(u => ({
          id: u._id.toString(),
          name: u.fullName,
          phone: u.phone,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt
        }))
      },
      superAdmin: superAdmin ? {
        id: superAdmin._id.toString(),
        name: superAdmin.fullName,
        phone: superAdmin.phone,
        role: superAdmin.role,
        status: superAdmin.status,
        createdAt: superAdmin.createdAt
      } : null,
      currentSession: session ? {
        userId: session.userId,
        role: session.role,
        matchesDatabaseUser: session.userId === superAdmin?._id.toString()
      } : null,
      action: {
        needed: !session || !superAdmin || session.userId !== superAdmin._id.toString(),
        description: !superAdmin ? 
          'No superadmin user found in database' :
          !session ? 
          'No session found' :
          session.userId !== superAdmin._id.toString() ?
          `Session needs to be updated to use database user ID: ${superAdmin._id.toString()}` :
          'Session is already using the correct database user'
      }
    });
    
  } catch (error) {
    console.error('❌ Check database user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
