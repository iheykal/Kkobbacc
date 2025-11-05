import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('👑 SuperAdmin fetching users...');
    
    // Check authentication using internal method
    const { getSessionFromRequest } = await import('@/lib/sessionUtils');
    const session = getSessionFromRequest(request);
    
    if (!session) {
      console.log('❌ No valid session found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please check your MongoDB connection string.' },
        { status: 500 }
      );
    }

    // Get user from database
    const User = (await import('@/models/User')).default;
    let currentUser;
    try {
      currentUser = await User.findById(session.userId).select('_id fullName phone role status permissions');
    } catch (queryError: any) {
      console.error('❌ Error querying user:', queryError);
      return NextResponse.json(
        { success: false, error: 'Error querying user from database' },
        { status: 500 }
      );
    }
    
    if (!currentUser) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    console.log('👑 Admin API auth check:', { userId: currentUser._id, role: currentUser.role });
    // Allow superadmin, agency, and users with admin permissions
    const allowedRoles = ['superadmin', 'super_admin', 'agency'];
    const hasAdminPermissions = currentUser.permissions?.canManageUsers;
    
    if (!allowedRoles.includes(currentUser.role) && !hasAdminPermissions) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    const query: any = {};
    
    if (role) {
      if (role.includes(',')) {
        query.role = { $in: role.split(',').map(r => r.trim()) };
      } else {
        query.role = role.trim();
      }
    }
    
    if (status) {
      query.status = status.trim();
    }

    // Fetch users
    let users;
    let totalCount;
    try {
      users = await User.find(query)
        .select('-password -passwordHash')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      // Get total count for pagination
      totalCount = await User.countDocuments(query);
    } catch (queryError: any) {
      console.error('❌ Error querying users:', queryError);
      return NextResponse.json(
        { success: false, error: `Error querying users: ${queryError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ SuperAdmin fetched ${users.length} users`);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching users:', error);
    const errorMessage = error?.message || 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: `Failed to fetch users: ${errorMessage}` },
      { status: 500 }
    );
  }
}
