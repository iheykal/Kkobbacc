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

    // Get ALL properties
    const allProperties = await Property.find({});

    console.log(`🔍 Debugging ${allProperties.length} properties for bucket URL analysis`);

    const results = {
      totalProperties: allProperties.length,
      withImages: 0,
      wrongBucket: 0,
      correctBucket: 0,
      bucketBreakdown: {} as Record<string, number>,
      properties: [] as any[]
    };

    // Analyze each property
    for (const property of allProperties) {
      const propertyData: any = {
        _id: property._id,
        title: property.title,
        thumbnailImage: property.thumbnailImage,
        images: property.images
      };

      let hasImages = false;
      let hasWrongBucket = false;
      let hasCorrectBucket = false;

      // Check thumbnailImage
      if (property.thumbnailImage && property.thumbnailImage.trim() !== '') {
        hasImages = true;
        
        // Extract bucket name from URL
        const bucketMatch = property.thumbnailImage.match(/\/kobac-([^\/]+)\//);
        if (bucketMatch) {
          const bucketName = `kobac-${bucketMatch[1]}`;
          results.bucketBreakdown[bucketName] = (results.bucketBreakdown[bucketName] || 0) + 1;
          
          if (bucketName === 'kobac-property-uploads') {
            hasWrongBucket = true;
          } else if (bucketName === 'kobac-real-estate') {
            hasCorrectBucket = true;
          }
        }
      }

      // Check images array
      if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        hasImages = true;
        
        for (const imageUrl of property.images) {
          if (imageUrl && imageUrl.trim() !== '') {
            // Extract bucket name from URL
            const bucketMatch = imageUrl.match(/\/kobac-([^\/]+)\//);
            if (bucketMatch) {
              const bucketName = `kobac-${bucketMatch[1]}`;
              results.bucketBreakdown[bucketName] = (results.bucketBreakdown[bucketName] || 0) + 1;
              
              if (bucketName === 'kobac-property-uploads') {
                hasWrongBucket = true;
              } else if (bucketName === 'kobac-real-estate') {
                hasCorrectBucket = true;
              }
            }
          }
        }
      }

      // Add to results
      if (hasImages) {
        results.withImages++;
        results.properties.push(propertyData);
        
        if (hasWrongBucket) {
          results.wrongBucket++;
        }
        if (hasCorrectBucket) {
          results.correctBucket++;
        }
      }
    }

    console.log(`🎯 Bucket URL analysis completed:`, {
      total: results.totalProperties,
      withImages: results.withImages,
      wrongBucket: results.wrongBucket,
      correctBucket: results.correctBucket,
      bucketBreakdown: results.bucketBreakdown
    });

    return NextResponse.json({
      success: true,
      message: `Analyzed ${results.totalProperties} properties`,
      results
    });

  } catch (error) {
    console.error('Error debugging bucket URLs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to debug bucket URLs' },
      { status: 500 }
    );
  }
}
