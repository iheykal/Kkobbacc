import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking property IDs...');
    
    await connectDB();
    
    // Get all properties with their IDs
    const properties = await Property.find({}).select('_id propertyId title').lean();
    
    const propertiesWithId = properties.filter(p => p.propertyId);
    const propertiesWithoutId = properties.filter(p => !p.propertyId);
    
    console.log(`Found ${properties.length} total properties`);
    console.log(`Properties with ID: ${propertiesWithId.length}`);
    console.log(`Properties without ID: ${propertiesWithoutId.length}`);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        total: properties.length,
        withId: propertiesWithId.length,
        withoutId: propertiesWithoutId.length,
        properties: properties.map(p => ({
          _id: p._id,
          propertyId: p.propertyId || 'N/A',
          title: p.title
        }))
      }
    });
    
  } catch (error) {
    console.error('💥 Error checking property IDs:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    );
  }
}
