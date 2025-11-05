import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug deletion flow...');
    
    await connectDB();
    
    // Check authentication
    const cookie = request.cookies.get('kobac_session')?.value;
    if (!cookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    let session: { userId: string; role: string } | null = null;
    try {
      session = JSON.parse(decodeURIComponent(cookie));
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }
    
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }
    
    // Get user info
    const user = await User.findById(session.userId).select('role fullName');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    // Get all properties with their deletion status
    const allProperties = await Property.find({}).lean();
    
    // Get properties pending deletion
    const pendingDeletions = await Property.find({ 
      deletionStatus: 'pending_deletion' 
    }).lean();
    
    // Get properties by this user
    const userProperties = await Property.find({ 
      agentId: session.userId 
    }).lean();
    
    return NextResponse.json({
      success: true,
      debug: {
        user: {
          id: session.userId,
          role: user.role,
          fullName: user.fullName
        },
        properties: {
          total: allProperties.length,
          pendingDeletion: pendingDeletions.length,
          userProperties: userProperties.length,
          byStatus: {
            active: allProperties.filter(p => p.deletionStatus === 'active' || !p.deletionStatus).length,
            pending_deletion: allProperties.filter(p => p.deletionStatus === 'pending_deletion').length,
            deleted: allProperties.filter(p => p.deletionStatus === 'deleted').length,
            noStatus: allProperties.filter(p => !p.deletionStatus).length
          }
        },
        pendingDeletions: pendingDeletions.map(p => ({
          _id: p._id,
          propertyId: p.propertyId,
          title: p.title,
          agentId: p.agentId,
          deletionRequestedAt: p.deletionRequestedAt,
          deletionRequestedBy: p.deletionRequestedBy
        })),
        userProperties: userProperties.map(p => ({
          _id: p._id,
          propertyId: p.propertyId,
          title: p.title,
          deletionStatus: p.deletionStatus,
          deletionRequestedAt: p.deletionRequestedAt,
          deletionRequestedBy: p.deletionRequestedBy
        }))
      }
    });
    
  } catch (error) {
    console.error('💥 Debug deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { propertyId } = await request.json();
    
    console.log('🔍 Testing deletion request for property:', propertyId);
    
    await connectDB();
    
    // Check authentication
    const cookie = request.cookies.get('kobac_session')?.value;
    if (!cookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    let session: { userId: string; role: string } | null = null;
    try {
      session = JSON.parse(decodeURIComponent(cookie));
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }
    
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }
    
    // Get user info
    const user = await User.findById(session.userId).select('role fullName');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    // Find the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    
    // Check if user is the owner or superadmin
    const isOwner = property.agentId.toString() === session.userId;
    const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin';
    
    return NextResponse.json({
      success: true,
      test: {
        property: {
          _id: property._id,
          propertyId: property.propertyId,
          title: property.title,
          agentId: property.agentId,
          deletionStatus: property.deletionStatus
        },
        user: {
          id: session.userId,
          role: user.role,
          fullName: user.fullName
        },
        permissions: {
          isOwner,
          isSuperAdmin,
          canDelete: isOwner || isSuperAdmin
        },
        currentStatus: {
          isActive: property.deletionStatus === 'active' || !property.deletionStatus,
          isPending: property.deletionStatus === 'pending_deletion',
          isDeleted: property.deletionStatus === 'deleted'
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Debug deletion test error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
