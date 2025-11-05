import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { getNextPropertyId } from '@/lib/propertyIdGenerator';

export async function GET(request: NextRequest) {
  return await POST(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting property ID migration...');
    
    await connectDB();
    
    // Find all properties that don't have a propertyId
    const propertiesWithoutId = await Property.find({ propertyId: { $exists: false } });
    console.log(`Found ${propertiesWithoutId.length} properties without propertyId`);
    
    if (propertiesWithoutId.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All properties already have propertyId' 
      });
    }
    
    // Update each property with a new propertyId
    const updatePromises = propertiesWithoutId.map(async (property) => {
      const nextId = await getNextPropertyId();
      return Property.findByIdAndUpdate(
        property._id,
        { propertyId: nextId },
        { new: true }
      );
    });
    
    const updatedProperties = await Promise.all(updatePromises);
    
    console.log(`✅ Successfully updated ${updatedProperties.length} properties with propertyId`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${updatedProperties.length} properties`,
      updatedCount: updatedProperties.length
    });
    
  } catch (error) {
    console.error('💥 Error migrating property IDs:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    );
  }
}
