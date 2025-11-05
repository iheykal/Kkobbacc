import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/utils';

export async function PUT(
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

    // Only superadmins can update avatars
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Only superadmins can update profile pictures. Please contact the superadmin to change your profile picture.' 
      }, { status: 403 });
    }

    // Superadmins can only update avatars for agents (not for themselves or other superadmins)
    if (currentUser.id === userId) {
      return NextResponse.json({ 
        error: 'Superadmins cannot update their own profile picture through this interface' 
      }, { status: 403 });
    }

    const { avatar } = await request.json();

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar URL is required' }, { status: 400 });
    }

    // Find and update the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the avatar directly in the profile
    if (!user.profile) {
      user.profile = {};
    }
    user.profile.avatar = avatar;
    
    // Clear any pending avatar change request
    if (user.avatarChangeRequest) {
      user.avatarChangeRequest = undefined;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Avatar updated successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        avatar: user.profile?.avatar
      }
    });

  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update avatar' },
      { status: 500 }
    );
  }
}
