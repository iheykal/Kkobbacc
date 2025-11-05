import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing users display issue...');
    await connectDB();

    // Check authentication
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    const authResult = await authResponse.json();
    
    if (!authResponse.ok || !authResult.data) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = authResult.data;
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    const fixes = [];

    // Fix 1: Ensure all users have proper role values
    const roleUpdates = await User.updateMany(
      { role: { $in: ['super_admin', 'normal_user'] } },
      [
        {
          $set: {
            role: {
              $switch: {
                branches: [
                  { case: { $eq: ['$role', 'super_admin'] }, then: 'superadmin' },
                  { case: { $eq: ['$role', 'normal_user'] }, then: 'user' }
                ],
                default: '$role'
              }
            }
          }
        }
      ]
    );
    
    if (roleUpdates.modifiedCount > 0) {
      fixes.push(`Updated ${roleUpdates.modifiedCount} user roles to new format`);
    }

    // Fix 2: Ensure all users have proper status values
    const statusUpdates = await User.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'active' } }
    );
    
    if (statusUpdates.modifiedCount > 0) {
      fixes.push(`Set status for ${statusUpdates.modifiedCount} users without status`);
    }

    // Fix 3: Ensure all users have permissions
    const permissionUpdates = await User.updateMany(
      { permissions: { $exists: false } },
      {
        $set: {
          permissions: {
            canManageUsers: false,
            canManageProperties: false,
            canManageAgents: false,
            canViewAnalytics: false,
            canManageSettings: false,
            canApproveProperties: false,
            canDeleteProperties: false,
            canManageRoles: false
          }
        }
      }
    );
    
    if (permissionUpdates.modifiedCount > 0) {
      fixes.push(`Added permissions for ${permissionUpdates.modifiedCount} users`);
    }

    // Fix 4: Get current user counts by role
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Fix 5: Test the admin users API
    const testUsers = await User.find({})
      .select('_id fullName phone role status createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`✅ Users display fix completed. Applied ${fixes.length} fixes.`);

    return NextResponse.json({
      success: true,
      message: 'Users display issue fixed',
      fixes,
      userCounts,
      sampleUsers: testUsers,
      totalUsers: await User.countDocuments({})
    });

  } catch (error) {
    console.error('❌ Error fixing users display:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix users display issue' },
      { status: 500 }
    );
  }
}
