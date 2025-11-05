import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database operations...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Test 1: Count all users
    const userCount = await User.countDocuments();
    console.log('📊 User count:', userCount);
    
    // Test 2: Find all users
    const allUsers = await User.find({});
    console.log('👥 All users found:', allUsers.length);
    
    // Test 3: Find superadmin users
    const superAdmins = await User.find({ role: 'superadmin' });
    console.log('👑 Superadmin users:', superAdmins.length);
    
    // Test 4: Try to find user by specific ID
    const testId = "68b9fcd7a872a2d5f47ecd54";
    const specificUser = await User.findById(testId);
    console.log('🎯 Specific user found:', specificUser ? 'Yes' : 'No');
    
    // Test 5: Try to find user by role
    const userByRole = await User.findOne({ role: 'superadmin' });
    console.log('🔍 User by role found:', userByRole ? 'Yes' : 'No');
    
    // Test 6: Check database name
    const mongoose = require('mongoose');
    const dbName = mongoose.connection.db.databaseName;
    console.log('🗄️ Database name:', dbName);
    
    // Test 7: List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections:', collections.map((c: any) => c.name));
    
    return NextResponse.json({
      success: true,
      tests: {
        userCount,
        allUsersFound: allUsers.length,
        superAdminCount: superAdmins.length,
        specificUserFound: !!specificUser,
        userByRoleFound: !!userByRole,
        databaseName: dbName,
        collections: collections.map((c: any) => c.name)
      },
      users: allUsers.map(u => ({
        id: u._id.toString(),
        name: u.fullName,
        phone: u.phone,
        role: u.role,
        status: u.status
      })),
      specificUser: specificUser ? {
        id: specificUser._id.toString(),
        name: specificUser.fullName,
        phone: specificUser.phone,
        role: specificUser.role,
        status: specificUser.status
      } : null,
      userByRole: userByRole ? {
        id: userByRole._id.toString(),
        name: userByRole.fullName,
        phone: userByRole.phone,
        role: userByRole.role,
        status: userByRole.status
      } : null
    });
    
  } catch (error) {
    console.error('❌ Database operations test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        error: error instanceof Error ? error.stack : String(error)
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing user creation...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Try to create a test user
    const testUser = new User({
      fullName: 'Test User',
      phone: '+252123456789',
      role: 'user',
      status: 'active',
      profile: {
        avatar: 'test-avatar.png',
        location: 'Somalia'
      }
    });
    
    const savedUser = await testUser.save();
    console.log('✅ Test user created:', savedUser._id);
    
    // Clean up - delete the test user
    await User.findByIdAndDelete(savedUser._id);
    console.log('🗑️ Test user deleted');
    
    return NextResponse.json({
      success: true,
      message: 'Database operations working correctly',
      testUser: {
        id: savedUser._id.toString(),
        name: savedUser.fullName,
        phone: savedUser.phone,
        role: savedUser.role
      }
    });
    
  } catch (error) {
    console.error('❌ User creation test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        error: error instanceof Error ? error.stack : String(error)
      }
    }, { status: 500 });
  }
}
