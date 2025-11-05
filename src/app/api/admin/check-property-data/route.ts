import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import Property from '@/models/Property';
import connectToDatabase from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only superadmin can access this
    const normalizedRole = session.role === 'super_admin' ? 'superadmin' : session.role;
    
    if (normalizedRole !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint' 
      }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    // Get all properties
    const allProperties = await Property.find({}).sort({ createdAt: -1 });

    console.log(`🔍 Checking property data for ${allProperties.length} properties`);

    const results = {
      totalProperties: allProperties.length,
      withThumbnail: 0,
      withImages: 0,
      recentProperties: 0,
      properties: [] as any[]
    };

    // Analyze each property
    for (const property of allProperties) {
      const propertyData: any = {
        _id: property._id,
        title: property.title,
        createdAt: property.createdAt,
        deletionStatus: property.deletionStatus,
        propertyType: property.propertyType,
        price: property.price,
        location: property.location,
        thumbnailImage: property.thumbnailImage,
        images: property.images
      };

      // Check if property has thumbnail
      if (property.thumbnailImage && property.thumbnailImage.trim() !== '') {
        results.withThumbnail++;
      }

      // Check if property has images array
      if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        results.withImages++;
      }

      // Check if property was created in the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (property.createdAt && new Date(property.createdAt) > oneDayAgo) {
        results.recentProperties++;
      }

      results.properties.push(propertyData);
    }

    console.log(`🎯 Property data analysis completed:`, {
      total: results.totalProperties,
      withThumbnail: results.withThumbnail,
      withImages: results.withImages,
      recent: results.recentProperties
    });

    return NextResponse.json({
      success: true,
      message: `Analyzed ${results.totalProperties} properties`,
      results
    });

  } catch (error) {
    console.error('Error checking property data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check property data' },
      { status: 500 }
    );
  }
}
