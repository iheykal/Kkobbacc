import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { UserRole, UserStatus } from '@/models/User';

// Ultimate superadmin protection constants
const ULTIMATE_SUPERADMIN_PHONE = '0610251014'
const ULTIMATE_SUPERADMIN_NAME = 'Kobac Real Estate'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 User promotion request received');
    await connectDB();
    
    const body = await request.json();
    const { targetUserId, newRole, adminUserId, adminPassword } = body;
    
    // Validate required fields
    if (!targetUserId || !newRole || !adminUserId || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!Object.values(UserRole).includes(newRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }
    
    // Verify admin credentials and permissions
    const adminUser = await User.findById(adminUserId);
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin user not found' },
        { status: 404 }
      );
    }
    
    // Check admin password
    if (adminUser.password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }
    
    // Check if admin has permission to manage roles
    if (!adminUser.permissions.canManageRoles) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to manage roles' },
        { status: 403 }
      );
    }
    
    // Find target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      );
    }
    
    // Check if the admin user is the ultimate superadmin (Kobac superadmin)
    const isKobacSuperadmin = adminUser.phone === ULTIMATE_SUPERADMIN_PHONE || 
                              adminUser.fullName === ULTIMATE_SUPERADMIN_NAME ||
                              adminUser.fullName.toLowerCase().includes('kobac')
    
    // Prevent role changes on SuperAdmin (only SuperAdmin or Kobac superadmin can change SuperAdmin)
    if (targetUser.role === UserRole.SUPER_ADMIN && 
        adminUser.role !== UserRole.SUPER_ADMIN && 
        !isKobacSuperadmin) {
      return NextResponse.json(
        { success: false, error: 'Only SuperAdmin or Kobac superadmin can modify SuperAdmin roles' },
        { status: 403 }
      );
    }
    
    // Prevent SuperAdmin from being demoted to lower roles (unless by Kobac superadmin)
    if (targetUser.role === UserRole.SUPER_ADMIN && newRole !== UserRole.SUPER_ADMIN) {
      if (!isKobacSuperadmin) {
        return NextResponse.json(
          { success: false, error: 'SuperAdmin cannot be demoted to lower roles' },
          { status: 400 }
        );
      }
      // Log the demotion for audit purposes
      console.log(`🔍 Kobac superadmin ${adminUser.fullName} is demoting superadmin ${targetUser.fullName} from ${targetUser.role} to ${newRole}`);
    }
    
    // 🖼️ AVATAR REQUIREMENT: Check if promoting to agent role requires avatar
    const isPromotingToAgent = [UserRole.AGENT, UserRole.AGENCY].includes(newRole as any)
    if (isPromotingToAgent) {
      const currentAvatar = targetUser.profile?.avatar
      if (!currentAvatar) {
        return NextResponse.json(
          { success: false, error: 'Profile picture is required to promote user to agent role. Please set a profile picture first.' },
          { status: 400 }
        );
      }
    }
    
    console.log(`✅ Promoting user ${targetUser.fullName} from ${targetUser.role} to ${newRole}`);
    
    // Update user role
    targetUser.role = newRole;
    
    // Set appropriate status based on new role
    if (newRole === UserRole.AGENT) {
      targetUser.status = UserStatus.PENDING_VERIFICATION;
    } else if (newRole === UserRole.NORMAL_USER) {
      targetUser.status = UserStatus.ACTIVE;
    } else if (newRole === UserRole.SUPER_ADMIN) {
      targetUser.status = UserStatus.ACTIVE;
    }
    
    // Save the updated user
    await targetUser.save();
    
    console.log(`✅ User ${targetUser.fullName} promoted successfully to ${newRole}`);
    
    // Return updated user data
    const userResponse = {
      id: targetUser._id,
      fullName: targetUser.fullName,
      phone: targetUser.phone,
      role: targetUser.role,
      status: targetUser.status,
      permissions: targetUser.permissions,
      updatedAt: targetUser.updatedAt
    };
    
    return NextResponse.json({ 
      success: true, 
      message: `User promoted to ${newRole} successfully`,
      data: userResponse
    });
    
  } catch (error) {
    console.error('Error during user promotion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to promote user' },
      { status: 500 }
    );
  }
}
