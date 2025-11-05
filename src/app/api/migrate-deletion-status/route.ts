import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  return await POST(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting deletion status migration...');
    
    await connectDB();
    
    // Find properties that don't have deletionStatus field
    const propertiesWithoutStatus = await Property.find({
      deletionStatus: { $exists: false }
    }).lean();
    
    console.log(`📊 Found ${propertiesWithoutStatus.length} properties without deletionStatus`);
    
    if (propertiesWithoutStatus.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All properties already have deletionStatus field',
        updatedCount: 0
      });
    }
    
    // Update all properties to have deletionStatus: 'active'
    const updateResult = await Property.updateMany(
      { deletionStatus: { $exists: false } },
      { $set: { deletionStatus: 'active' } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} properties with deletionStatus: 'active'`);
    
    // Verify the update
    const remainingProperties = await Property.find({
      deletionStatus: { $exists: false }
    }).lean();
    
    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${updateResult.modifiedCount} properties`,
      updatedCount: updateResult.modifiedCount,
      remainingWithoutStatus: remainingProperties.length,
      sampleProperties: propertiesWithoutStatus.slice(0, 3).map(p => ({
        _id: p._id,
        title: p.title,
        propertyId: p.propertyId,
        agent: p.agent
      }))
    });
    
  } catch (error) {
    console.error('💥 Error during deletion status migration:', error);
    return NextResponse.json(
      { success: false, error: `Migration failed: ${error}` },
      { status: 500 }
    );
  }
}
