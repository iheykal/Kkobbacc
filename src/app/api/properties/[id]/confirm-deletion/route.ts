import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Processing deletion confirmation for property:', params.id);
    
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
    
    // Get user info and check if superadmin
    const user = await User.findById(session.userId).select('role fullName');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin';
    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only superadmin can confirm deletions' }, { status: 403 });
    }
    
    // Find the property
    const property = await Property.findById(params.id);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    
    // Check if property is pending deletion
    if (property.deletionStatus !== 'pending_deletion') {
      return NextResponse.json({ 
        success: false, 
        error: 'Property is not pending deletion',
        currentStatus: property.deletionStatus
      }, { status: 400 });
    }
    
    console.log('📋 Property details before deletion:', {
      _id: property._id,
      propertyId: property.propertyId,
      title: property.title,
      deletionStatus: property.deletionStatus,
      deletionRequestedAt: property.deletionRequestedAt,
      deletionRequestedBy: property.deletionRequestedBy
    });
    
    // Permanently delete the property
    const deletionResult = await Property.findByIdAndDelete(params.id);
    
    if (!deletionResult) {
      console.error('❌ Failed to delete property from database');
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete property from database' 
      }, { status: 500 });
    }
    
    // Verify the property is actually deleted
    const verifyDeletion = await Property.findById(params.id);
    if (verifyDeletion) {
      console.error('❌ Property still exists after deletion attempt');
      return NextResponse.json({ 
        success: false, 
        error: 'Property deletion failed - property still exists' 
      }, { status: 500 });
    }
    
    console.log('✅ Property permanently deleted and verified:', {
      propertyId: property.propertyId,
      title: property.title,
      deletedBy: user.fullName,
      deletedAt: new Date(),
      verification: 'Property no longer exists in database'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Property has been permanently deleted from the system.',
      data: {
        propertyId: property.propertyId,
        title: property.title,
        deletedBy: user.fullName,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('💥 Error confirming property deletion:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
