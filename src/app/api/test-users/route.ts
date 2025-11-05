import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing users...');
    
    await connectDB();
    
    // Get all users with their roles
    const users = await User.find({}, 'fullName phone role status').lean();
    
    // Count by role
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      roleCounts,
      users: users.map(user => ({
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status
      }))
    });
    
  } catch (error) {
    console.error('💥 Test users error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
