import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { UserRole, UserStatus } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Promote Kobac to SuperAdmin request received');
    await connectDB();
    
    // Find the user named "kobac" (case insensitive)
    const kobacUser = await User.findOne({
      $or: [
        { fullName: { $regex: /kobac/i } },
        { fullName: { $regex: /kobac real estate/i } }
      ]
    });

    if (!kobacUser) {
      console.log('❌ No user found with name containing "kobac"');
      
      // List all users for debugging
      const allUsers = await User.find({}, 'fullName phone role status');
      console.log('📋 Available users:');
      allUsers.forEach(user => {
        console.log(`  - ${user.fullName} (${user.phone}) - Role: ${user.role} - Status: ${user.status}`);
      });
      
      return NextResponse.json({
        success: false,
        error: 'No user found with name containing "kobac"',
        availableUsers: allUsers.map(u => ({
          id: u._id,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role,
          status: u.status
        }))
      }, { status: 404 });
    }

    console.log(`👤 Found user: ${kobacUser.fullName} (${kobacUser.phone})`);
    console.log(`📊 Current role: ${kobacUser.role}`);
    console.log(`📊 Current status: ${kobacUser.status}`);

    // Check if already superadmin
    if (kobacUser.role === UserRole.SUPERADMIN || kobacUser.role === UserRole.SUPER_ADMIN) {
      console.log('✅ User is already a superadmin!');
      return NextResponse.json({
        success: true,
        message: 'User is already a superadmin',
        user: {
          id: kobacUser._id,
          fullName: kobacUser.fullName,
          phone: kobacUser.phone,
          role: kobacUser.role,
          status: kobacUser.status
        }
      });
    }

    // Promote to superadmin
    console.log('🚀 Promoting user to superadmin...');
    
    kobacUser.role = UserRole.SUPERADMIN;
    kobacUser.status = UserStatus.ACTIVE;
    kobacUser.permissions = {
      canManageUsers: true,
      canManageProperties: true,
      canManageAgents: true,
      canViewAnalytics: true,
      canManageRoles: true
    };

    await kobacUser.save();

    console.log('✅ Successfully promoted kobac to superadmin!');
    
    return NextResponse.json({
      success: true,
      message: 'Successfully promoted kobac to superadmin!',
      user: {
        id: kobacUser._id,
        fullName: kobacUser.fullName,
        phone: kobacUser.phone,
        role: kobacUser.role,
        status: kobacUser.status,
        permissions: kobacUser.permissions
      }
    });

  } catch (error) {
    console.error('❌ Error promoting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to promote user to superadmin' },
      { status: 500 }
    );
  }
}
