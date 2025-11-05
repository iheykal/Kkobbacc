import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing deletion request...');
    
    await connectDB();
    
    const { propertyId, agentId } = await request.json();
    
    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Property ID required' }, { status: 400 });
    }
    
    // Find the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    
    // Find the agent (use provided agentId or property's agentId)
    const targetAgentId = agentId || property.agentId;
    const agent = await User.findById(targetAgentId);
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }
    
    console.log('📋 Property details:', {
      _id: property._id,
      propertyId: property.propertyId,
      title: property.title,
      agentId: property.agentId,
      currentDeletionStatus: property.deletionStatus
    });
    
    console.log('👤 Agent details:', {
      _id: agent._id,
      fullName: agent.fullName,
      role: agent.role
    });
    
    // Check if property is already pending deletion or deleted
    if (property.deletionStatus === 'pending_deletion') {
      return NextResponse.json({ 
        success: false, 
        error: 'Property is already pending deletion',
        property: {
          _id: property._id,
          propertyId: property.propertyId,
          title: property.title,
          deletionStatus: property.deletionStatus,
          deletionRequestedAt: property.deletionRequestedAt,
          deletionRequestedBy: property.deletionRequestedBy
        }
      }, { status: 400 });
    }
    
    if (property.deletionStatus === 'deleted') {
      return NextResponse.json({ 
        success: false, 
        error: 'Property is already deleted',
        property: {
          _id: property._id,
          propertyId: property.propertyId,
          title: property.title,
          deletionStatus: property.deletionStatus
        }
      }, { status: 400 });
    }
    
    // Update property to pending deletion
    property.deletionStatus = 'pending_deletion';
    property.deletionRequestedAt = new Date();
    property.deletionRequestedBy = agent.fullName || 'Unknown';
    
    await property.save();
    
    console.log('✅ Property marked for deletion:', {
      propertyId: property.propertyId,
      title: property.title,
      requestedBy: agent.fullName,
      requestedAt: property.deletionRequestedAt
    });
    
    return NextResponse.json({
      success: true,
      message: 'Property marked for deletion successfully',
      property: {
        _id: property._id,
        propertyId: property.propertyId,
        title: property.title,
        deletionStatus: property.deletionStatus,
        deletionRequestedAt: property.deletionRequestedAt,
        deletionRequestedBy: property.deletionRequestedBy
      }
    });
    
  } catch (error) {
    console.error('💥 Test deletion request error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
