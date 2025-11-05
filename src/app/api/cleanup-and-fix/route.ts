import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, setSessionCookie, createSessionPayload } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Cleaning up and fixing to use only database user...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Find the actual superadmin user from database
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    if (!superAdmin) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    console.log('👤 Using database user:', {
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
    
    // Check if session already uses the database user
    if (session.userId === superAdmin._id.toString()) {
      return NextResponse.json({
        success: true,
        message: "Session already uses the correct database user",
        databaseUser: {
          id: superAdmin._id.toString(),
          name: superAdmin.fullName,
          phone: superAdmin.phone,
          role: superAdmin.role,
          status: superAdmin.status
        },
        session: {
          userId: session.userId,
          role: session.role,
          isCorrect: true
        }
      });
    }
    
    // Create new session with database user ID
    const newSessionPayload = createSessionPayload(superAdmin._id.toString(), superAdmin.role);
    console.log('🔄 Creating new session with database user ID:', newSessionPayload);
    
    // Verify the user exists in database
    const verifyUser = await User.findById(newSessionPayload.userId);
    if (!verifyUser) {
      return NextResponse.json({
        success: false,
        error: "Database user verification failed"
      });
    }
    
    console.log('✅ Database user verified:', {
      id: verifyUser._id.toString(),
      name: verifyUser.fullName,
      role: verifyUser.role
    });
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Session cleaned up and updated to use database user only",
      cleanup: {
        oldSessionUserId: session.userId,
        newSessionUserId: superAdmin._id.toString(),
        updated: true
      },
      databaseUser: {
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
        sessionUpdated: true
      }
    });
    
    // Set the new session cookie
    setSessionCookie(response, newSessionPayload, process.env.NODE_ENV === 'production');
    
    console.log('✅ Session cookie updated with database user ID');
    
    return response;
    
  } catch (error) {
    console.error('❌ Cleanup and fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking cleanup status...');
    
    // Connect to database
    await connectDB();
    
    // Find superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    
    // Get current session
    const session = getSessionFromRequest(request);
    
    return NextResponse.json({
      success: true,
      databaseUser: superAdmin ? {
        id: superAdmin._id.toString(),
        name: superAdmin.fullName,
        phone: superAdmin.phone,
        role: superAdmin.role,
        status: superAdmin.status
      } : null,
      currentSession: session ? {
        userId: session.userId,
        role: session.role,
        isUsingDatabaseUser: session.userId === superAdmin?._id.toString()
      } : null,
      status: {
        databaseUserExists: !!superAdmin,
        sessionExists: !!session,
        sessionUsesDatabaseUser: session && superAdmin && session.userId === superAdmin._id.toString(),
        needsCleanup: !session || !superAdmin || session.userId !== superAdmin._id.toString()
      },
      action: {
        needed: !session || !superAdmin || session.userId !== superAdmin._id.toString(),
        description: !superAdmin ? 
          'No superadmin user found in database' :
          !session ? 
          'No session found' :
          session.userId !== superAdmin._id.toString() ?
          `Cleanup needed: Update session from "${session.userId}" to database user "${superAdmin._id.toString()}"` :
          'No cleanup needed - session already uses database user'
      }
    });
    
  } catch (error) {
    console.error('❌ Check cleanup status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
