import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging database connection and data...');
    
    // Test database connection
    console.log('📡 Testing database connection...');
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Test User model
    console.log('👥 Testing User model...');
    const totalUsers = await User.countDocuments();
    console.log('📊 Total users in database:', totalUsers);
    
    // Get all users
    const allUsers = await User.find({}).select('_id fullName phone role status createdAt').limit(10);
    console.log('👤 All users:', allUsers.map(u => ({
      id: u._id.toString(),
      name: u.fullName,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt
    })));
    
    // Test Property model
    console.log('🏠 Testing Property model...');
    const totalProperties = await Property.countDocuments();
    console.log('📊 Total properties in database:', totalProperties);
    
    // Check for superadmin specifically
    console.log('👑 Looking for superadmin users...');
    const superAdmins = await User.find({ role: 'superadmin' }).select('_id fullName phone role status');
    console.log('👑 Superadmin users found:', superAdmins.length);
    
    // Check for any admin roles
    console.log('🔍 Looking for any admin roles...');
    const adminUsers = await User.find({ 
      role: { $in: ['superadmin', 'super_admin', 'admin', 'administrator'] }
    }).select('_id fullName phone role status');
    console.log('🔍 Admin users found:', adminUsers.length);
    
    // Test database operations
    console.log('🧪 Testing database operations...');
    const testUser = await User.findOne({}).select('_id fullName role');
    console.log('🧪 Test user found:', testUser ? {
      id: testUser._id.toString(),
      name: testUser.fullName,
      role: testUser.role
    } : 'No users found');
    
    // Check MongoDB connection status
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    console.log('🔌 MongoDB connection state:', connectionStates[connectionState as keyof typeof connectionStates]);
    
    return NextResponse.json({
      success: true,
      database: {
        connected: connectionState === 1,
        connectionState: connectionStates[connectionState as keyof typeof connectionStates],
        totalUsers,
        totalProperties,
        superAdminCount: superAdmins.length,
        adminCount: adminUsers.length
      },
      users: allUsers.map(u => ({
        id: u._id.toString(),
        name: u.fullName,
        phone: u.phone,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt
      })),
      superAdmins: superAdmins.map(u => ({
        id: u._id.toString(),
        name: u.fullName,
        phone: u.phone,
        role: u.role,
        status: u.status
      })),
      adminUsers: adminUsers.map(u => ({
        id: u._id.toString(),
        name: u.fullName,
        phone: u.phone,
        role: u.role,
        status: u.status
      })),
      testUser: testUser ? {
        id: testUser._id.toString(),
        name: testUser.fullName,
        role: testUser.role
      } : null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
      }
    });
    
  } catch (error) {
    console.error('❌ Database debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        error: error instanceof Error ? error.stack : String(error),
        connectionState: 'Failed to connect'
      }
    }, { status: 500 });
  }
}
