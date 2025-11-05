import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { getPrimaryImageUrl } from '@/lib/imageUrlResolver';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/debug-recommendations - Starting request');
    await connectDB();
    console.log('✅ GET /api/debug-recommendations - Connected to database');

    const { searchParams } = request.nextUrl;
    const district = searchParams.get('district');
    const excludeId = searchParams.get('excludeId');
    const limit = parseInt(searchParams.get('limit') || '6');

    console.log('🔍 GET /api/debug-recommendations - Request params:', {
      district,
      excludeId,
      limit
    });

    if (!district) {
      console.log('❌ GET /api/debug-recommendations - No district provided');
      return NextResponse.json(
        { error: 'District parameter is required' },
        { status: 400 }
      );
    }

    // Build query to find similar properties
    let query: any = {
      district: district,
      deletionStatus: { $ne: 'deleted' }
    };

    // Exclude the current property if excludeId is provided
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

    console.log('🔍 GET /api/debug-recommendations - Query:', JSON.stringify(query, null, 2));

    // Find similar properties in the same district
    console.log('🔍 GET /api/debug-recommendations - Executing database query...');
    const similarProperties = await Property.find(query)
      .populate('agentId', 'name phone avatar rating')
      .sort({ 
        featured: -1, // Featured properties first
        viewCount: -1, // Then by view count
        createdAt: -1 // Then by newest
      })
      .limit(limit)
      .lean();
    
    console.log('✅ GET /api/debug-recommendations - Found properties:', similarProperties.length);

    // Debug each property's image data
    const debugData = similarProperties.map(property => {
      const primaryImageUrl = getPrimaryImageUrl(property);
      
      return {
        _id: property._id,
        propertyId: property.propertyId,
        title: property.title,
        district: property.district,
        imageData: {
          thumbnailImage: property.thumbnailImage,
          images: property.images,
          hasThumbnail: !!property.thumbnailImage,
          hasImages: !!(property.images && property.images.length > 0),
          primaryImageUrl: primaryImageUrl,
          hasValidImage: !!primaryImageUrl,
          imageCount: property.images ? property.images.length : 0
        },
        issues: [] as string[]
      };
    });

    // Identify issues
    debugData.forEach(property => {
      const { imageData } = property;
      
      if (!imageData.hasThumbnail && !imageData.hasImages) {
        property.issues.push('No images at all');
      }
      
      if (imageData.hasThumbnail && !imageData.thumbnailImage?.trim()) {
        property.issues.push('Empty thumbnail string');
      }
      
      if (imageData.hasImages && imageData.imageCount === 0) {
        property.issues.push('Empty images array');
      }
      
      if (imageData.hasThumbnail && imageData.thumbnailImage && !imageData.thumbnailImage.includes('r2.dev') && !imageData.thumbnailImage.includes('r2.cloudflarestorage.com')) {
        property.issues.push('Thumbnail is not R2 URL');
      }
      
      if (imageData.hasImages && imageData.images) {
        const hasR2Images = imageData.images.some((img: string) => 
          img.includes('r2.dev') || img.includes('r2.cloudflarestorage.com')
        );
        if (!hasR2Images) {
          property.issues.push('No R2 images in images array');
        }
      }
      
      if (!imageData.hasValidImage) {
        property.issues.push('No valid primary image URL');
      }
    });

    const summary = {
      totalProperties: debugData.length,
      propertiesWithImages: debugData.filter(p => p.imageData.hasValidImage).length,
      propertiesWithoutImages: debugData.filter(p => !p.imageData.hasValidImage).length,
      propertiesWithIssues: debugData.filter(p => p.issues.length > 0).length,
      commonIssues: {} as Record<string, number>
    };

    // Count common issues
    debugData.forEach(property => {
      property.issues.forEach(issue => {
        summary.commonIssues[issue] = (summary.commonIssues[issue] || 0) + 1;
      });
    });

    return NextResponse.json({
      success: true,
      debugData,
      summary,
      query: {
        district,
        excludeId,
        limit
      }
    });

  } catch (error) {
    console.error('❌ GET /api/debug-recommendations - Error:', error);
    console.error('❌ GET /api/debug-recommendations - Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to debug recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
