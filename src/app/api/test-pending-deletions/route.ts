import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing pending deletions with images...');
    await connectDB();
    const allProperties = await Property.find({}).lean();
    const pendingDeletions = await Property.find({ deletionStatus: 'pending_deletion' }).lean();
    const byStatus = {
      active: allProperties.filter(p => p.deletionStatus === 'active' || !p.deletionStatus).length,
      pending_deletion: allProperties.filter(p => p.deletionStatus === 'pending_deletion').length,
      deleted: allProperties.filter(p => p.deletionStatus === 'deleted').length,
      noStatus: allProperties.filter(p => !p.deletionStatus).length
    };
    
    return NextResponse.json({
      success: true,
      totalProperties: allProperties.length,
      pendingDeletions: pendingDeletions.length,
      byStatus,
      pendingProperties: pendingDeletions.map(p => ({ 
        _id: p._id, 
        propertyId: p.propertyId, 
        title: p.title, 
        agentId: p.agentId, 
        deletionRequestedAt: p.deletionRequestedAt, 
        deletionRequestedBy: p.deletionRequestedBy,
        thumbnailImage: p.thumbnailImage,
        images: p.images,
        hasThumbnail: !!p.thumbnailImage,
        hasImages: !!(p.images && p.images.length > 0),
        imageCount: p.images ? p.images.length : 0
      })),
      sampleProperties: allProperties.slice(0, 5).map(p => ({ 
        _id: p._id, 
        propertyId: p.propertyId, 
        title: p.title, 
        deletionStatus: p.deletionStatus, 
        agentId: p.agentId,
        thumbnailImage: p.thumbnailImage,
        images: p.images,
        hasThumbnail: !!p.thumbnailImage,
        hasImages: !!(p.images && p.images.length > 0)
      }))
    });
  } catch (error) { 
    console.error('💥 Test pending deletions error:', error); 
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 }); 
  }
}
