import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Showing correct user ID for session...');
    
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
    
    // Find the superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone role status');
    if (!superAdmin) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    // Check if session user ID matches
    const isCorrect = session.userId === superAdmin._id.toString();
    
    return NextResponse.json({
      success: true,
      currentSession: {
        userId: session.userId,
        role: session.role
      },
      correctUser: {
        id: superAdmin._id.toString(),
        name: superAdmin.fullName,
        phone: superAdmin.phone,
        role: superAdmin.role,
        status: superAdmin.status
      },
      comparison: {
        isCorrect,
        needsUpdate: !isCorrect,
        currentUserId: session.userId,
        correctUserId: superAdmin._id.toString(),
        match: session.userId === superAdmin._id.toString()
      },
      action: {
        needed: !isCorrect,
        description: !isCorrect ? 
          `Session needs to be updated from "${session.userId}" to "${superAdmin._id.toString()}"` :
          "Session is already correct"
      }
    });
    
  } catch (error) {
    console.error('❌ Show correct user ID error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
