import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import Property from '@/models/Property';
import connectToDatabase from '@/lib/mongodb';

export async function POST(request: NextRequest) {
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

    // Get all properties with their image data
    const allProperties = await Property.find({}).select('_id title thumbnailImage images');

    console.log(`🔍 Inspecting ${allProperties.length} properties for URL analysis`);

    // Analyze URLs
    const bucketAnalysis: Record<string, number> = {};
    const domainAnalysis: Record<string, number> = {};
    let propertiesWithImages = 0;
    const properties: any[] = [];

    for (const property of allProperties) {
      let hasImages = false;
      const propertyData: any = {
        _id: property._id,
        title: property.title,
        thumbnailImage: property.thumbnailImage,
        images: property.images
      };

      // Analyze thumbnail image
      if (property.thumbnailImage) {
        hasImages = true;
        analyzeUrl(property.thumbnailImage, bucketAnalysis, domainAnalysis);
      }

      // Analyze images array
      if (property.images && Array.isArray(property.images)) {
        for (const imageUrl of property.images) {
          if (imageUrl) {
            hasImages = true;
            analyzeUrl(imageUrl, bucketAnalysis, domainAnalysis);
          }
        }
      }

      if (hasImages) {
        propertiesWithImages++;
        properties.push(propertyData);
      }
    }

    console.log(`📊 Analysis complete: ${propertiesWithImages} properties with images, ${Object.keys(bucketAnalysis).length} unique buckets, ${Object.keys(domainAnalysis).length} unique domains`);

    return NextResponse.json({
      success: true,
      message: 'Property URL inspection completed',
      totalProperties: allProperties.length,
      propertiesWithImages,
      uniqueBuckets: Object.keys(bucketAnalysis).length,
      uniqueDomains: Object.keys(domainAnalysis).length,
      bucketAnalysis,
      domainAnalysis,
      properties
    });

  } catch (error) {
    console.error('Error inspecting property URLs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to inspect property URLs' },
      { status: 500 }
    );
  }
}

function analyzeUrl(url: string, bucketAnalysis: Record<string, number>, domainAnalysis: Record<string, number>) {
  try {
    // Extract bucket name from URL
    // Pattern: https://domain/bucket/path
    const urlParts = url.split('/');
    if (urlParts.length >= 4) {
      const bucket = urlParts[3]; // The bucket is typically the 4th part
      bucketAnalysis[bucket] = (bucketAnalysis[bucket] || 0) + 1;
    }

    // Extract domain from URL
    const domainMatch = url.match(/https?:\/\/([^\/]+)/);
    if (domainMatch) {
      const domain = domainMatch[1];
      domainAnalysis[domain] = (domainAnalysis[domain] || 0) + 1;
    }
  } catch (error) {
    console.error('Error analyzing URL:', url, error);
  }
}
