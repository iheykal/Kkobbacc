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

    // Get all properties with images
    const properties = await Property.find({
      $or: [
        { thumbnailImage: { $exists: true, $nin: ['', null] } },
        { images: { $exists: true, $nin: [[], null] } }
      ]
    });

    console.log(`🔍 Testing R2 URLs for ${properties.length} properties`);

    const results = {
      totalUrls: 0,
      accessible: 0,
      inaccessible: 0,
      properties: properties.length,
      urlTests: [] as any[],
      r2Config: {
        bucket: process.env.R2_BUCKET,
        publicBase: process.env.R2_PUBLIC_BASE,
        endpoint: process.env.R2_ENDPOINT
      }
    };

    // Test each property's URLs
    for (const property of properties) {
      const urlsToTest: string[] = [];

      // Add thumbnail URL
      if (property.thumbnailImage && property.thumbnailImage.trim() !== '') {
        urlsToTest.push(property.thumbnailImage);
      }

      // Add image URLs
      if (property.images && Array.isArray(property.images)) {
        property.images.forEach((imageUrl: string) => {
          if (imageUrl && imageUrl.trim() !== '') {
            urlsToTest.push(imageUrl);
          }
        });
      }

      // Test each URL
      for (const url of urlsToTest) {
        results.totalUrls++;
        
        // Declare timeoutId in the outer scope to ensure it's accessible in catch block
        let timeoutId: NodeJS.Timeout | null = null;
        
        try {
          // Test URL accessibility with timeout
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal
          });
          
          if (timeoutId) clearTimeout(timeoutId);
          
          const isAccessible = response.ok;
          
          if (isAccessible) {
            results.accessible++;
          } else {
            results.inaccessible++;
          }

          results.urlTests.push({
            propertyId: property._id,
            propertyTitle: property.title,
            url: url,
            accessible: isAccessible,
            status: response.status,
            error: isAccessible ? null : `HTTP ${response.status}: ${response.statusText}`
          });

          console.log(`🔗 URL test: ${url} - ${isAccessible ? '✅' : '❌'} (${response.status})`);
          
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          results.inaccessible++;
          results.urlTests.push({
            propertyId: property._id,
            propertyTitle: property.title,
            url: url,
            accessible: false,
            status: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          console.log(`🔗 URL test: ${url} - ❌ Error: ${error}`);
        }
      }
    }

    console.log(`🎯 R2 URL test completed: ${results.accessible} accessible, ${results.inaccessible} inaccessible`);

    return NextResponse.json({
      success: true,
      message: `Tested ${results.totalUrls} URLs from ${results.properties} properties`,
      results
    });

  } catch (error) {
    console.error('Error testing R2 URLs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test R2 URLs' },
      { status: 500 }
    );
  }
}
