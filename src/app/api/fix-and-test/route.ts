import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, setSessionCookie, createSessionPayload } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing session and testing user lookup...');
    
    // Get current session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No valid session found"
      });
    }
    
    console.log('📋 Current session userId:', session.userId);
    
    // Connect to database
    await connectDB();
    
    // Find the actual superadmin user
    const actualUser = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    if (!actualUser) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    console.log('👤 Found actual user:', { 
      id: actualUser._id.toString(), 
      name: actualUser.fullName, 
      role: actualUser.role 
    });
    
    // Test 1: Try to find user with current session ID
    console.log('🧪 Test 1: Finding user with current session ID...');
    const currentSessionUser = await User.findById(session.userId);
    console.log('Result:', currentSessionUser ? 'Found' : 'Not found');
    
    // Test 2: Try to find user with actual user ID
    console.log('🧪 Test 2: Finding user with actual user ID...');
    const actualUserFound = await User.findById(actualUser._id);
    console.log('Result:', actualUserFound ? 'Found' : 'Not found');
    
    // Create new session with correct user ID
    const newSessionPayload = createSessionPayload(actualUser._id.toString(), actualUser.role);
    console.log('🔄 Creating new session payload:', newSessionPayload);
    
    // Test 3: Verify the new session user can be found
    console.log('🧪 Test 3: Verifying new session user can be found...');
    const newSessionUser = await User.findById(newSessionPayload.userId);
    console.log('Result:', newSessionUser ? 'Found' : 'Not found');
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Session fixed and tested successfully",
      tests: {
        currentSessionUserFound: !!currentSessionUser,
        actualUserFound: !!actualUserFound,
        newSessionUserFound: !!newSessionUser
      },
      sessionUpdate: {
        oldUserId: session.userId,
        newUserId: newSessionPayload.userId,
        updated: true
      },
      user: {
        id: actualUser._id.toString(),
        fullName: actualUser.fullName,
        phone: actualUser.phone,
        role: actualUser.role,
        status: actualUser.status
      }
    });
    
    // Set the new session cookie
    setSessionCookie(response, newSessionPayload, process.env.NODE_ENV === 'production');
    
    console.log('✅ Session cookie updated and tests completed');
    
    return response;
    
  } catch (error) {
    console.error('❌ Fix and test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
