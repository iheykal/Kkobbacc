import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing agent properties...');
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    if (!agentId) {
      return NextResponse.json({ success: false, error: 'Agent ID required' }, { status: 400 });
    }
    
    console.log('🔍 Looking for properties with agentId:', agentId);
    
    // Get all properties for this agent (no filters)
    const allProperties = await Property.find({ agentId }).lean();
    console.log('🔍 All properties for agent:', allProperties.length);
    
    // Get properties with different statuses
    const activeProperties = await Property.find({ 
      agentId, 
      $or: [
        { deletionStatus: 'active' },
        { deletionStatus: { $exists: false } }
      ]
    }).lean();
    
    const pendingDeletions = await Property.find({ 
      agentId, 
      deletionStatus: 'pending_deletion' 
    }).lean();
    
    const deletedProperties = await Property.find({ 
      agentId, 
      deletionStatus: 'deleted' 
    }).lean();
    
    return NextResponse.json({
      success: true,
      agentId,
      counts: {
        total: allProperties.length,
        active: activeProperties.length,
        pendingDeletion: pendingDeletions.length,
        deleted: deletedProperties.length
      },
      properties: allProperties.map(p => ({
        _id: p._id,
        propertyId: p.propertyId,
        title: p.title,
        agentId: p.agentId,
        deletionStatus: p.deletionStatus,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('💥 Test agent properties error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
