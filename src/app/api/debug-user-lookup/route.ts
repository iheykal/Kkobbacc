import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging user lookup...');
    
    // Get session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No valid session found"
      });
    }
    
    console.log('📋 Session data:', session);
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Try to find the user
    const userId = session.userId;
    console.log('🔍 Looking for user with ID:', userId);
    
    const user = await User.findById(userId).select('_id fullName phone role status createdAt profile.avatar');
    
    if (!user) {
      console.log('❌ User not found in database');
      
      // Let's also check if there are any users at all
      const totalUsers = await User.countDocuments();
      console.log('📊 Total users in database:', totalUsers);
      
      // Check if the ID format is valid
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
      console.log('🔍 Is valid ObjectId format:', isValidObjectId);
      
      // Try to find users with similar IDs
      const similarUsers = await User.find({
        _id: { $regex: userId.substring(0, 8) }
      }).select('_id fullName phone role').limit(5);
      
      return NextResponse.json({
        success: false,
        error: "User not found in database",
        debug: {
          sessionUserId: userId,
          isValidObjectId,
          totalUsersInDB: totalUsers,
          similarUsers: similarUsers,
          searchPattern: userId.substring(0, 8)
        }
      });
    }
    
    console.log('✅ User found:', { id: user._id, fullName: user.fullName, role: user.role });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.profile?.avatar,
        createdAt: user.createdAt
      },
      debug: {
        sessionUserId: userId,
        userFound: true,
        userRole: user.role
      }
    });
    
  } catch (error) {
    console.error('❌ User lookup debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        error: error instanceof Error ? error.stack : String(error)
      }
    }, { status: 500 });
  }
}
