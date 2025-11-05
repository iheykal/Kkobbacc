import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { getNextPropertyId } from '@/lib/propertyIdGenerator';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to fix missing property IDs
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Find properties without propertyId
    const propertiesWithoutId = await Property.find({
      $or: [
        { propertyId: { $exists: false } },
        { propertyId: null },
        { propertyId: undefined }
      ]
    }).select('_id title propertyId');
    
    console.log(`Found ${propertiesWithoutId.length} properties without propertyId`);
    
    if (propertiesWithoutId.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All properties already have propertyId',
        count: 0
      });
    }
    
    // Get the highest existing propertyId
    const highestProperty = await Property.findOne(
      { propertyId: { $exists: true, $ne: null } },
      { propertyId: 1, _id: 0 }, // Only fetch the propertyId field
      { sort: { propertyId: -1 } }
    ).lean();
    
    // Start from the next ID after the highest found, or 1 if no properties exist
    const highestId = highestProperty?.propertyId;
    let nextId = typeof highestId === 'number' ? highestId + 1 : 1;
    
    // Update properties without propertyId
    const updatePromises = propertiesWithoutId.map(async (property) => {
      const newPropertyId = nextId++;
      await Property.findByIdAndUpdate(property._id, {
        propertyId: newPropertyId
      });
      return {
        _id: property._id,
        title: property.title,
        newPropertyId: newPropertyId
      };
    });
    
    const updatedProperties = await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedProperties.length} properties with propertyId`,
      count: updatedProperties.length,
      properties: updatedProperties
    });
    
  } catch (error) {
    console.error('Error fixing property IDs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix property IDs' },
      { status: 500 }
    );
  }
}
