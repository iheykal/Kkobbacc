import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking deleted properties issue...');
    await connectDB();

    const { searchParams } = request.nextUrl;
    const district = searchParams.get('district');
    const excludeId = searchParams.get('excludeId');

    // Get all properties
    const allProperties = await Property.find({}).lean();
    
    // Get properties by deletion status
    const activeProperties = await Property.find({ 
      deletionStatus: { $ne: 'deleted' } 
    }).lean();
    
    const deletedProperties = await Property.find({ 
      deletionStatus: 'deleted' 
    }).lean();
    
    const pendingDeletionProperties = await Property.find({ 
      deletionStatus: 'pending_deletion' 
    }).lean();

    // Test the similar properties query
    let query: any = {
      district: district || 'Hodan', // Default district for testing
      deletionStatus: { $ne: 'deleted' }
    };

    if (excludeId) {
      const excludeIdNum = parseInt(excludeId);
      if (!isNaN(excludeIdNum)) {
        query.$and = [
          { _id: { $ne: excludeId } },
          { propertyId: { $ne: excludeIdNum } }
        ];
      } else {
        query._id = { $ne: excludeId };
      }
    }

    const similarProperties = await Property.find(query)
      .populate('agentId', 'name phone avatar rating')
      .sort({ 
        featured: -1,
        viewCount: -1,
        createdAt: -1
      })
      .limit(6)
      .lean();

    return NextResponse.json({
      success: true,
      debug: {
        totalProperties: allProperties.length,
        activeProperties: activeProperties.length,
        deletedProperties: deletedProperties.length,
        pendingDeletionProperties: pendingDeletionProperties.length,
        similarPropertiesFound: similarProperties.length
      },
      query: query,
      similarProperties: similarProperties.map(p => ({
        _id: p._id,
        propertyId: p.propertyId,
        title: p.title,
        district: p.district,
        deletionStatus: p.deletionStatus,
        agentId: p.agentId,
        agent: p.agent,
        createdAt: p.createdAt
      })),
      allProperties: allProperties.map(p => ({
        _id: p._id,
        propertyId: p.propertyId,
        title: p.title,
        district: p.district,
        deletionStatus: p.deletionStatus,
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Debug deleted properties error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
