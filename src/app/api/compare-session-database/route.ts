import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Comparing session user ID with database user ID...');
    
    // Get current session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No valid session found"
      });
    }
    
    console.log('📋 Session data:', {
      userId: session.userId,
      role: session.role,
      sessionId: session.sessionId
    });
    
    // Connect to database
    await connectDB();
    
    // Test 1: Try to find user with session user ID
    console.log('🧪 Test 1: Finding user with session user ID...');
    const sessionUser = await User.findById(session.userId);
    console.log('Session user found:', sessionUser ? 'Yes' : 'No');
    
    // Test 2: Find all users in database
    console.log('🧪 Test 2: Finding all users...');
    const allUsers = await User.find({}).select('_id fullName phone role status');
    console.log('Total users found:', allUsers.length);
    
    // Test 3: Find superadmin users
    console.log('🧪 Test 3: Finding superadmin users...');
    const superAdmins = await User.find({ role: 'superadmin' }).select('_id fullName phone role status');
    console.log('Superadmin users found:', superAdmins.length);
    
    // Test 4: Check if session user ID matches any user ID
    console.log('🧪 Test 4: Checking if session user ID matches any user...');
    const matchingUser = allUsers.find(user => user._id.toString() === session.userId);
    console.log('Matching user found:', matchingUser ? 'Yes' : 'No');
    
    // Test 5: Check ObjectId format
    console.log('🧪 Test 5: Checking ObjectId format...');
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(session.userId);
    console.log('Session user ID is valid ObjectId:', isValidObjectId);
    
    // Test 6: Try different search methods
    console.log('🧪 Test 6: Trying different search methods...');
    const userByString = await User.findOne({ _id: session.userId });
    const userByObjectId = await User.findById(session.userId);
    const userByRole = await User.findOne({ role: session.role });
    
    console.log('User by string search:', userByString ? 'Found' : 'Not found');
    console.log('User by ObjectId search:', userByObjectId ? 'Found' : 'Not found');
    console.log('User by role search:', userByRole ? 'Found' : 'Not found');
    
    return NextResponse.json({
      success: true,
      session: {
        userId: session.userId,
        role: session.role,
        sessionId: session.sessionId
      },
      database: {
        totalUsers: allUsers.length,
        superAdminCount: superAdmins.length,
        allUsers: allUsers.map(u => ({
          id: u._id.toString(),
          name: u.fullName,
          phone: u.phone,
          role: u.role,
          status: u.status
        })),
        superAdmins: superAdmins.map(u => ({
          id: u._id.toString(),
          name: u.fullName,
          phone: u.phone,
          role: u.role,
          status: u.status
        }))
      },
      comparison: {
        sessionUserIdExists: !!sessionUser,
        sessionUserIdMatchesAnyUser: !!matchingUser,
        isValidObjectId,
        searchResults: {
          byString: !!userByString,
          byObjectId: !!userByObjectId,
          byRole: !!userByRole
        }
      },
      analysis: {
        sessionUserId: session.userId,
        actualUserIds: allUsers.map(u => u._id.toString()),
        superAdminIds: superAdmins.map(u => u._id.toString()),
        mismatch: !sessionUser && superAdmins.length > 0,
        recommendedAction: !sessionUser && superAdmins.length > 0 ? 
          `Update session to use superadmin ID: ${superAdmins[0]._id.toString()}` : 
          'Session is correct'
      }
    });
    
  } catch (error) {
    console.error('❌ Compare session database error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        error: error instanceof Error ? error.stack : String(error)
      }
    }, { status: 500 });
  }
}
