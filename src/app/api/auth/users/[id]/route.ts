import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { canAccessResource } from '@/lib/authz/authorize';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization for accessing this specific user
    const authResult = await canAccessResource(
      {
        sessionUserId: session.userId,
        role: session.role,
        action: 'read',
        resource: 'user',
        resourceId: params.id
      },
      async (id: string) => {
        return await User.findById(id);
      }
    );
    
    if (!authResult.allowed) {
      // Return 404 to hide existence of the resource
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    // Get the user data (already loaded by canAccessResource)
    const user = authResult.resource as any;
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        avatar: user?.profile?.avatar,
        licenseNumber: user?.agentProfile?.licenseNumber,
        permissions: user.permissions || {
          canManageUsers: false,
          canManageProperties: false,
          canManageAgents: false,
          canViewAnalytics: false
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
