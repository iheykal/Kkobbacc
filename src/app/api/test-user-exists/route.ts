import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing if user exists...');
    
    // Get session
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No valid session found"
      });
    }
    
    console.log('📋 Session userId:', session.userId);
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Try multiple ways to find the user
    const userId = session.userId;
    
    // Method 1: Direct findById
    console.log('🔍 Method 1: Direct findById...');
    const user1 = await User.findById(userId);
    console.log('Result 1:', user1 ? 'Found' : 'Not found');
    
    // Method 2: findById with select
    console.log('🔍 Method 2: findById with select...');
    const user2 = await User.findById(userId).select('_id fullName phone role status');
    console.log('Result 2:', user2 ? 'Found' : 'Not found');
    
    // Method 3: findOne with _id
    console.log('🔍 Method 3: findOne with _id...');
    const user3 = await User.findOne({ _id: userId });
    console.log('Result 3:', user3 ? 'Found' : 'Not found');
    
    // Method 4: Check if ObjectId is valid
    console.log('🔍 Method 4: Check ObjectId validity...');
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    console.log('Is valid ObjectId:', isValidObjectId);
    
    // Method 5: Count total users
    console.log('🔍 Method 5: Count total users...');
    const totalUsers = await User.countDocuments();
    console.log('Total users:', totalUsers);
    
    // Method 6: Get first few users to see the format
    console.log('🔍 Method 6: Get sample users...');
    const sampleUsers = await User.find({}).select('_id fullName role').limit(3);
    console.log('Sample users:', sampleUsers.map(u => ({ id: u._id, name: u.fullName, role: u.role })));
    
    // Method 7: Try to find by string comparison
    console.log('🔍 Method 7: String comparison...');
    const user7 = await User.findOne({ _id: { $eq: userId } });
    console.log('Result 7:', user7 ? 'Found' : 'Not found');
    
    return NextResponse.json({
      success: true,
      debug: {
        sessionUserId: userId,
        isValidObjectId,
        totalUsers,
        sampleUsers: sampleUsers.map(u => ({ id: u._id.toString(), name: u.fullName, role: u.role })),
        results: {
          findById: user1 ? 'Found' : 'Not found',
          findByIdWithSelect: user2 ? 'Found' : 'Not found',
          findOneWithId: user3 ? 'Found' : 'Not found',
          stringComparison: user7 ? 'Found' : 'Not found'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Test user exists error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        error: error instanceof Error ? error.stack : String(error)
      }
    }, { status: 500 });
  }
}
