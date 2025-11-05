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

    // Get properties with images
    const propertiesWithImages = await Property.find({
      $or: [
        { thumbnailImage: { $exists: true, $ne: '' } },
        { images: { $exists: true, $ne: [] } }
      ]
    }).select('_id title thumbnailImage images').limit(10);

    console.log(`🔍 Testing R2 access for ${propertiesWithImages.length} properties`);

    const urlTests: any[] = [];
    let accessibleUrls = 0;
    let inaccessibleUrls = 0;

    // Test each URL
    for (const property of propertiesWithImages) {
      const urlsToTest: string[] = [];

      // Add thumbnail image
      if (property.thumbnailImage) {
        urlsToTest.push(property.thumbnailImage);
      }

      // Add images from array
      if (property.images && Array.isArray(property.images)) {
        urlsToTest.push(...property.images.slice(0, 2)); // Test first 2 images
      }

      // Test each URL
      for (const url of urlsToTest) {
        try {
          const response = await fetch(url, {
            method: 'HEAD', // Just check if accessible, don't download
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const isAccessible = response.ok;
          
          if (isAccessible) {
            accessibleUrls++;
          } else {
            inaccessibleUrls++;
          }

          urlTests.push({
            propertyId: property._id,
            propertyTitle: property.title,
            url: url,
            accessible: isAccessible,
            status: response.status,
            statusText: response.statusText,
            error: isAccessible ? null : `HTTP ${response.status}: ${response.statusText}`
          });

        } catch (error) {
          inaccessibleUrls++;
          urlTests.push({
            propertyId: property._id,
            propertyTitle: property.title,
            url: url,
            accessible: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Get R2 configuration
    const r2Config = {
      bucket: process.env.R2_BUCKET,
      publicBase: process.env.R2_PUBLIC_BASE,
      publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
      endpoint: process.env.R2_ENDPOINT
    };

    console.log(`📊 R2 access test complete: ${accessibleUrls} accessible, ${inaccessibleUrls} inaccessible`);

    return NextResponse.json({
      success: true,
      message: 'R2 access test completed',
      totalUrls: urlTests.length,
      accessibleUrls,
      inaccessibleUrls,
      urlTests,
      r2Config
    });

  } catch (error) {
    console.error('Error testing R2 access:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test R2 access' },
      { status: 500 }
    );
  }
}
