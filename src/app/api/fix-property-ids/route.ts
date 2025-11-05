import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Starting robust property ID fix...');
    
    await connectDB();
    
    // Get all properties
    const allProperties = await Property.find({}).lean();
    console.log(`Found ${allProperties.length} total properties`);
    
    // Check which ones need IDs
    const propertiesNeedingIds = allProperties.filter(p => !p.propertyId);
    console.log(`Properties needing IDs: ${propertiesNeedingIds.length}`);
    
    if (propertiesNeedingIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All properties already have IDs',
        total: allProperties.length,
        withIds: allProperties.length,
        withoutIds: 0
      });
    }
    
    // Assign sequential IDs starting from 1
    let nextId = 1;
    const updateResults = [];
    
    for (const property of propertiesNeedingIds) {
      try {
        const updatedProperty = await Property.findByIdAndUpdate(
          property._id,
          { propertyId: nextId },
          { new: true }
        );
        
        if (updatedProperty) {
          updateResults.push({
            _id: property._id,
            title: property.title,
            oldPropertyId: property.propertyId,
            newPropertyId: nextId,
            success: true
          });
          nextId++;
        } else {
          updateResults.push({
            _id: property._id,
            title: property.title,
            oldPropertyId: property.propertyId,
            newPropertyId: null,
            success: false,
            error: 'Update failed'
          });
        }
      } catch (error) {
        updateResults.push({
          _id: property._id,
          title: property.title,
          oldPropertyId: property.propertyId,
          newPropertyId: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Verify the updates
    const finalCheck = await Property.find({}).select('_id propertyId title').lean();
    const withIds = finalCheck.filter(p => p.propertyId);
    const withoutIds = finalCheck.filter(p => !p.propertyId);
    
    console.log(`✅ Final check: ${withIds.length} with IDs, ${withoutIds.length} without IDs`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Property ID fix completed`,
      summary: {
        total: allProperties.length,
        processed: propertiesNeedingIds.length,
        successful: updateResults.filter(r => r.success).length,
        failed: updateResults.filter(r => !r.success).length,
        finalWithIds: withIds.length,
        finalWithoutIds: withoutIds.length
      },
      updates: updateResults,
      finalState: finalCheck.map(p => ({
        _id: p._id,
        propertyId: p.propertyId || 'N/A',
        title: p.title
      }))
    });
    
  } catch (error) {
    console.error('💥 Error fixing property IDs:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
