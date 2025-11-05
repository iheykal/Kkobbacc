import { NextRequest, NextResponse } from 'next/server';
import Property from '@/models/Property';
import { connectToDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking properties in database...');
    
    // Connect to database
    await connectToDatabase();
    
    // Get all properties
    const allProperties = await Property.find({}).lean();
    
    // Get properties with different statuses
    const activeProperties = await Property.find({ 
      deletionStatus: { $ne: 'deleted' } 
    }).lean();
    
    const deletedProperties = await Property.find({ 
      deletionStatus: 'deleted' 
    }).lean();
    
    const pendingDeletionProperties = await Property.find({ 
      deletionStatus: 'pending_deletion' 
    }).lean();
    
    console.log('🔍 Database property counts:', {
      total: allProperties.length,
      active: activeProperties.length,
      deleted: deletedProperties.length,
      pendingDeletion: pendingDeletionProperties.length
    });
    
    // Sample a few properties to see their structure
    const sampleProperties = allProperties.slice(0, 3).map(prop => ({
      _id: prop._id,
      title: prop.title,
      district: prop.district,
      location: prop.location,
      price: prop.price,
      agentId: prop.agentId,
      deletionStatus: prop.deletionStatus,
      thumbnailImage: prop.thumbnailImage,
      images: prop.images,
      createdAt: prop.createdAt,
      updatedAt: prop.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      counts: {
        total: allProperties.length,
        active: activeProperties.length,
        deleted: deletedProperties.length,
        pendingDeletion: pendingDeletionProperties.length
      },
      sampleProperties,
      allProperties: allProperties.map(prop => ({
        _id: prop._id,
        title: prop.title,
        district: prop.district,
        location: prop.location,
        price: prop.price,
        agentId: prop.agentId,
        deletionStatus: prop.deletionStatus,
        createdAt: prop.createdAt
      }))
    });
    
  } catch (error: any) {
    console.error('❌ Debug properties error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to debug properties' },
      { status: 500 }
    );
  }
}