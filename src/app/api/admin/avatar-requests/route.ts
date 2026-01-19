import { NextRequest, NextResponse } from 'next/server';
import { safeConnectDB } from '@/lib/db-utils';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/serverUtils';

// Get all pending avatar change requests
export async function GET(request: NextRequest) {
  try {
    const dbConnection = await safeConnectDB();
    if (!dbConnection) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Get authenticated user
    const currentUser = await getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is superadmin
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({
        error: 'Only superadmins can manage avatar change requests'
      }, { status: 403 });
    }

    // Find all users with pending avatar change requests
    const usersWithRequests = await User.find({
      'avatarChangeRequest.status': 'pending'
    }).select('_id fullName phone role avatarChangeRequest profile.avatar createdAt');

    const requests = usersWithRequests.map(user => ({
      id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      currentAvatar: user.profile?.avatar,
      request: user.avatarChangeRequest,
      createdAt: user.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error getting avatar requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get avatar requests' },
      { status: 500 }
    );
  }
}

// Approve or reject avatar change request
export async function PATCH(request: NextRequest) {
  try {
    const dbConnection = await safeConnectDB();
    if (!dbConnection) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Get authenticated user
    const currentUser = await getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is superadmin
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({
        error: 'Only superadmins can manage avatar change requests'
      }, { status: 403 });
    }

    const { userId, action, rejectionReason } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be either "approve" or "reject"' }, { status: 400 });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a pending request
    if (!user.avatarChangeRequest || user.avatarChangeRequest.status !== 'pending') {
      return NextResponse.json({ error: 'No pending avatar change request found' }, { status: 400 });
    }

    if (action === 'approve') {
      // Approve the request
      user.profile = user.profile || {};
      user.profile.avatar = user.avatarChangeRequest.requestedAvatar;

      user.avatarChangeRequest.status = 'approved';
      user.avatarChangeRequest.reviewedBy = currentUser._id;
      user.avatarChangeRequest.reviewedAt = new Date();

      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Avatar change request approved successfully',
        data: {
          id: user._id,
          fullName: user.fullName,
          newAvatar: user.profile.avatar,
          reviewedBy: currentUser.fullName,
          reviewedAt: user.avatarChangeRequest.reviewedAt
        }
      });

    } else {
      // Reject the request
      user.avatarChangeRequest.status = 'rejected';
      user.avatarChangeRequest.reviewedBy = currentUser._id;
      user.avatarChangeRequest.reviewedAt = new Date();
      user.avatarChangeRequest.rejectionReason = rejectionReason || 'Request rejected by admin';

      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Avatar change request rejected',
        data: {
          id: user._id,
          fullName: user.fullName,
          rejectionReason: user.avatarChangeRequest.rejectionReason,
          reviewedBy: currentUser.fullName,
          reviewedAt: user.avatarChangeRequest.reviewedAt
        }
      });
    }

  } catch (error) {
    console.error('Error processing avatar request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process avatar request' },
      { status: 500 }
    );
  }
}
