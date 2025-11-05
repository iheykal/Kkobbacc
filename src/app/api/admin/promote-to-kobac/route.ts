import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { UserRole, UserStatus } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('👑 Promoting user to Kobac SuperAdmin...');
    await connectDB();
    
    const body = await request.json();
    const { userId, newPassword } = body;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Found user:', user.fullName, user.phone);
    
    // Check if there's already a SuperAdmin
    const existingSuperAdmin = await User.findOne({ 
      role: { $in: [UserRole.SUPER_ADMIN, UserRole.SUPERADMIN] },
      _id: { $ne: userId } // Exclude current user
    });
    
    if (existingSuperAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Another SuperAdmin already exists. Please delete the existing one first.',
          existingSuperAdmin: {
            id: existingSuperAdmin._id,
            fullName: existingSuperAdmin.fullName,
            phone: existingSuperAdmin.phone
          }
        },
        { status: 409 }
      );
    }
    
    // Use direct MongoDB update to bypass Mongoose validation
    const updateResult = await User.updateOne(
      { _id: userId },
      {
        $set: {
          fullName: "Kobac Real Estate",
          phone: "+252610251014",
          role: UserRole.SUPERADMIN,
          status: UserStatus.ACTIVE,
          password: newPassword || "8080kobac",
          passwordChangedAt: new Date(),
          "profile.location": "Somalia",
          "profile.occupation": "System Administrator",
          "profile.company": "Kobac Real Estate",
          "preferences.language": "en",
          "preferences.currency": "USD",
          "preferences.timezone": "Africa/Mogadishu",
          "security.loginAttempts": 0,
          "security.twoFactorEnabled": false,
          "security.mustChangePassword": false,
          "permissions.canManageUsers": true,
          "permissions.canManageProperties": true,
          "permissions.canManageAgents": true,
          "permissions.canViewAnalytics": true,
          "permissions.canManageSettings": true,
          "permissions.canApproveProperties": true,
          "permissions.canDeleteProperties": true,
          "permissions.canManageRoles": true
        },
        $unset: { passwordHash: "" }
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No changes were made to the user' },
        { status: 400 }
      );
    }
    
    // Fetch the updated user
    const updatedUser = await User.findById(userId);
    
    console.log('✅ User promoted to Kobac SuperAdmin successfully');
    
    return NextResponse.json({
      success: true,
      message: 'User promoted to Kobac SuperAdmin successfully',
      data: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        role: updatedUser.role,
        status: updatedUser.status,
        hasPassword: !!(updatedUser as any).password,
        hasPasswordHash: !!updatedUser.passwordHash,
        updatedAt: updatedUser.updatedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error promoting user to Kobac:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to promote user to Kobac',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
