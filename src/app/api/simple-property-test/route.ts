import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple Property Test: Starting...');
    
    await connectDB();
    console.log('🔍 Simple Property Test: Database connected');
    
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    
    console.log('🔍 Simple Property Test: Property ID:', propertyId);
    
    if (!propertyId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Property ID is required' 
      }, { status: 400 });
    }
    
    // Try to find the property
    console.log('🔍 Simple Property Test: Searching for property...');
    
    let property = null;
    
    // First try by propertyId (number)
    if (!isNaN(Number(propertyId))) {
      property = await Property.findOne({ 
        propertyId: parseInt(propertyId),
        deletionStatus: { $ne: 'deleted' }
      }).lean();
      console.log('🔍 Simple Property Test: Found by propertyId:', !!property);
    }
    
    // If not found, try by _id
    if (!property) {
      property = await Property.findById(propertyId).lean();
      console.log('🔍 Simple Property Test: Found by _id:', !!property);
    }
    
    if (!property) {
      console.log('❌ Simple Property Test: Property not found');
      return NextResponse.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }
    
    console.log('✅ Simple Property Test: Property found:', property._id);
    
    // Return basic property info
    const basicInfo = {
      _id: property._id,
      propertyId: property.propertyId,
      title: property.title,
      location: property.location,
      district: property.district,
      price: property.price,
      status: property.status,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      // Image fields
      thumbnailImage: property.thumbnailImage,
      images: property.images,
      // Check if image fields exist
      hasThumbnailImage: !!property.thumbnailImage,
      hasImagesArray: !!property.images && Array.isArray(property.images) && property.images.length > 0,
      // Count images
      thumbnailImageLength: property.thumbnailImage?.length || 0,
      imagesArrayLength: property.images?.length || 0
    };
    
    console.log('✅ Simple Property Test: Basic info prepared');
    
    return NextResponse.json({
      success: true,
      data: basicInfo,
      message: 'Property found successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Simple Property Test error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Simple property test failed' },
      { status: 500 }
    );
  }
}

