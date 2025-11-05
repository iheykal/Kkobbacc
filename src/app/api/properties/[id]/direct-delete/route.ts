import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const propertyId = params.id;
    
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
    
    // Check user role - allow both 'superadmin' and 'super_admin'
    const user = await User.findById(session.userId).select('role');
    const isSuperAdmin = user && (user.role === 'superadmin' || user.role === 'super_admin');
    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Find and delete the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    
    // Permanently delete the property
    await Property.findByIdAndDelete(propertyId);
    
    console.log(`Property ${propertyId} deleted by superadmin ${session.userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Property deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
