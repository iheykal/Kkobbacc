import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';
import Property from '@/models/Property';
import { DEFAULT_AVATAR_URL } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting avatar URL fix for all users and properties...');
    await connectDB();

    // Check if user is SuperAdmin
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    const authResult = await authResponse.json();
    
    if (!authResponse.ok || (!authResult.user && !authResult.data)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user || authResult.data;
    if (currentUser.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'SuperAdmin access required' },
        { status: 403 }
      );
    }

    const oldUnsplashUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
    const oldUnsplashUrl2 = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80';
    const oldUnsplashUrl3 = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80';

    // Fix User avatars
    console.log('👤 Fixing user avatars...');
    const userUpdateResult = await User.updateMany(
      {
        $or: [
          { 'profile.avatar': oldUnsplashUrl },
          { 'profile.avatar': oldUnsplashUrl2 },
          { 'profile.avatar': oldUnsplashUrl3 },
          { 'profile.avatar': { $regex: /unsplash\.com.*1472099645785/ } }
        ]
      },
      {
        $set: { 'profile.avatar': DEFAULT_AVATAR_URL }
      }
    );

    console.log(`✅ Updated ${userUpdateResult.modifiedCount} user avatars`);

    // Fix Property agent images
    console.log('🏠 Fixing property agent images...');
    const propertyUpdateResult = await Property.updateMany(
      {
        $or: [
          { 'agent.image': oldUnsplashUrl },
          { 'agent.image': oldUnsplashUrl2 },
          { 'agent.image': oldUnsplashUrl3 },
          { 'agent.image': { $regex: /unsplash\.com.*1472099645785/ } }
        ]
      },
      {
        $set: { 'agent.image': DEFAULT_AVATAR_URL }
      }
    );

    console.log(`✅ Updated ${propertyUpdateResult.modifiedCount} property agent images`);

    // Get summary of current state
    const totalUsers = await User.countDocuments();
    const usersWithOldAvatar = await User.countDocuments({
      $or: [
        { 'profile.avatar': oldUnsplashUrl },
        { 'profile.avatar': oldUnsplashUrl2 },
        { 'profile.avatar': oldUnsplashUrl3 },
        { 'profile.avatar': { $regex: /unsplash\.com.*1472099645785/ } }
      ]
    });

    const totalProperties = await Property.countDocuments();
    const propertiesWithOldAvatar = await Property.countDocuments({
      $or: [
        { 'agent.image': oldUnsplashUrl },
        { 'agent.image': oldUnsplashUrl2 },
        { 'agent.image': oldUnsplashUrl3 },
        { 'agent.image': { $regex: /unsplash\.com.*1472099645785/ } }
      ]
    });

    console.log('📊 Fix Summary:');
    console.log(`  - Users updated: ${userUpdateResult.modifiedCount}`);
    console.log(`  - Properties updated: ${propertyUpdateResult.modifiedCount}`);
    console.log(`  - Remaining users with old avatar: ${usersWithOldAvatar}`);
    console.log(`  - Remaining properties with old avatar: ${propertiesWithOldAvatar}`);

    return NextResponse.json({
      success: true,
      message: 'Avatar URLs fixed successfully',
      data: {
        usersUpdated: userUpdateResult.modifiedCount,
        propertiesUpdated: propertyUpdateResult.modifiedCount,
        remainingUsersWithOldAvatar: usersWithOldAvatar,
        remainingPropertiesWithOldAvatar: propertiesWithOldAvatar,
        totalUsers,
        totalProperties,
        newDefaultAvatar: DEFAULT_AVATAR_URL
      }
    });

  } catch (error) {
    console.error('❌ Error fixing avatar URLs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix avatar URLs' },
      { status: 500 }
    );
  }
}
