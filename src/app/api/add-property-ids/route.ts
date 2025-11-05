import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Adding propertyId field to existing documents...');
    
    await connectDB();
    
    // Get all properties that don't have propertyId field
    const properties = await Property.find({ propertyId: { $exists: false } }).lean();
    console.log(`Found ${properties.length} properties without propertyId field`);
    
    if (properties.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All properties already have propertyId field' 
      });
    }
    
    // Add propertyId field to each document sequentially
    let nextId = 1;
    const updateResults = [];
    
    for (const property of properties) {
      try {
        // Use updateOne to add the propertyId field
        const result = await Property.updateOne(
          { _id: property._id },
          { $set: { propertyId: nextId } }
        );
        
        if (result.modifiedCount > 0) {
          updateResults.push({
            _id: property._id,
            title: property.title,
            newPropertyId: nextId,
            success: true
          });
          nextId++;
        } else {
          updateResults.push({
            _id: property._id,
            title: property.title,
            newPropertyId: null,
            success: false,
            error: 'No document modified'
          });
        }
      } catch (error) {
        updateResults.push({
          _id: property._id,
          title: property.title,
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
      message: `Property ID field addition completed`,
      summary: {
        total: properties.length,
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
    console.error('💥 Error adding property IDs:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
