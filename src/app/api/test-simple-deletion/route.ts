import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Simple deletion test...');
    
    await connectDB();
    console.log('✅ Database connected');
    
    const { propertyId } = await request.json();
    console.log('📋 Property ID:', propertyId);
    
    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Property ID required' }, { status: 400 });
    }
    
    // Find the property
    const property = await Property.findById(propertyId);
    console.log('🔍 Property found:', !!property);
    
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    
    console.log('📋 Property details:', {
      _id: property._id,
      propertyId: property.propertyId,
      title: property.title,
      agentId: property.agentId,
      deletionStatus: property.deletionStatus
    });
    
    // Check current status
    if (property.deletionStatus === 'pending_deletion') {
      return NextResponse.json({ 
        success: false, 
        error: 'Property is already pending deletion',
        currentStatus: property.deletionStatus
      }, { status: 400 });
    }
    
    if (property.deletionStatus === 'deleted') {
      return NextResponse.json({ 
        success: false, 
        error: 'Property is already deleted',
        currentStatus: property.deletionStatus
      }, { status: 400 });
    }
    
    // Update property to pending deletion using findByIdAndUpdate to avoid validation issues
    console.log('🔄 Updating property to pending deletion...');
    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      {
        deletionStatus: 'pending_deletion',
        deletionRequestedAt: new Date(),
        deletionRequestedBy: 'Test Agent'
      },
      { new: true, runValidators: false }
    );
    
    if (!updatedProperty) {
      return NextResponse.json({ success: false, error: 'Failed to update property' }, { status: 500 });
    }
    
    console.log('✅ Property updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Property marked for deletion successfully',
      property: {
        _id: updatedProperty._id,
        propertyId: updatedProperty.propertyId,
        title: updatedProperty.title,
        deletionStatus: updatedProperty.deletionStatus,
        deletionRequestedAt: updatedProperty.deletionRequestedAt,
        deletionRequestedBy: updatedProperty.deletionRequestedBy
      }
    });
    
  } catch (error) {
    console.error('💥 Simple deletion test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
