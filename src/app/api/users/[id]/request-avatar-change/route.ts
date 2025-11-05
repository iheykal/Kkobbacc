import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Get authenticated user
    const currentUser = await getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Only superadmins can request avatar changes
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Only superadmins can request avatar changes' 
      }, { status: 403 });
    }

    const { avatar } = await request.json();

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar URL is required' }, { status: 400 });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if there's already a pending request
    if (user.avatarChangeRequest?.status === 'pending') {
      return NextResponse.json({ 
        error: 'You already have a pending avatar change request. Please wait for admin approval.',
        code: 'PENDING_REQUEST_EXISTS'
      }, { status: 400 });
    }

    // Create or update avatar change request
    user.avatarChangeRequest = {
      requestedAvatar: avatar,
      requestedAt: new Date(),
      status: 'pending'
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Avatar change request submitted successfully. Waiting for admin approval.',
      data: {
        id: user._id,
        fullName: user.fullName,
        requestedAvatar: avatar,
        status: 'pending',
        requestedAt: user.avatarChangeRequest.requestedAt
      }
    });

  } catch (error) {
    console.error('Error requesting avatar change:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit avatar change request' },
      { status: 500 }
    );
  }
}

// Get avatar change request status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Get authenticated user
    const currentUser = await getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Only superadmins can check avatar change requests
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Only superadmins can view avatar change requests' 
      }, { status: 403 });
    }

    // Find the user
    const user = await User.findById(userId).select('_id fullName avatarChangeRequest');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasRequest: !!user.avatarChangeRequest,
        request: user.avatarChangeRequest
      }
    });

  } catch (error) {
    console.error('Error getting avatar change request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get avatar change request' },
      { status: 500 }
    );
  }
}
