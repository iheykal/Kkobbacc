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

    // Get all properties
    const allProperties = await Property.find({}).select('_id title thumbnailImage images');

    console.log(`🔍 Diagnosing ${allProperties.length} properties for R2 URLs`);

    // Define the correct R2 domain
    const correctDomain = 'pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev';
    
    // Define wrong domains to look for
    const wrongDomains = [
      'pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev',
      'pub-36a660b428c343399354263f0c318585.r2.dev'
    ];

    // Analyze properties
    let propertiesWithImages = 0;
    let propertiesWithWrongUrls = 0;
    let propertiesWithCorrectUrls = 0;
    const domainBreakdown: Record<string, number> = {};
    const sampleProperties: any[] = [];

    for (const property of allProperties) {
      let hasImages = false;
      let hasWrongUrls = false;
      let hasCorrectUrls = false;

      // Check thumbnailImage
      if (property.thumbnailImage) {
        hasImages = true;
        
        // Check for wrong domains
        for (const wrongDomain of wrongDomains) {
          if (property.thumbnailImage.includes(wrongDomain)) {
            hasWrongUrls = true;
            domainBreakdown[wrongDomain] = (domainBreakdown[wrongDomain] || 0) + 1;
          }
        }
        
        // Check for correct domain
        if (property.thumbnailImage.includes(correctDomain)) {
          hasCorrectUrls = true;
          domainBreakdown[correctDomain] = (domainBreakdown[correctDomain] || 0) + 1;
        }
      }

      // Check images array
      if (property.images && Array.isArray(property.images)) {
        for (const imageUrl of property.images) {
          if (imageUrl) {
            hasImages = true;
            
            // Check for wrong domains
            for (const wrongDomain of wrongDomains) {
              if (imageUrl.includes(wrongDomain)) {
                hasWrongUrls = true;
                domainBreakdown[wrongDomain] = (domainBreakdown[wrongDomain] || 0) + 1;
              }
            }
            
            // Check for correct domain
            if (imageUrl.includes(correctDomain)) {
              hasCorrectUrls = true;
              domainBreakdown[correctDomain] = (domainBreakdown[correctDomain] || 0) + 1;
            }
          }
        }
      }

      // Count properties
      if (hasImages) {
        propertiesWithImages++;
      }
      
      if (hasWrongUrls) {
        propertiesWithWrongUrls++;
        // Add to sample if we haven't reached the limit
        if (sampleProperties.length < 10) {
          sampleProperties.push({
            _id: property._id,
            title: property.title,
            thumbnailImage: property.thumbnailImage,
            images: property.images
          });
        }
      }
      
      if (hasCorrectUrls && !hasWrongUrls) {
        propertiesWithCorrectUrls++;
      }
    }

    // Also check for other R2 domains that might exist
    const allR2Domains = new Set<string>();
    for (const property of allProperties) {
      if (property.thumbnailImage && property.thumbnailImage.includes('.r2.dev')) {
        const match = property.thumbnailImage.match(/pub-[a-f0-9]+\.r2\.dev/);
        if (match) {
          allR2Domains.add(match[0]);
        }
      }
      
      if (property.images && Array.isArray(property.images)) {
        for (const imageUrl of property.images) {
          if (imageUrl && imageUrl.includes('.r2.dev')) {
            const match = imageUrl.match(/pub-[a-f0-9]+\.r2\.dev/);
            if (match) {
              allR2Domains.add(match[0]);
            }
          }
        }
      }
    }

    // Add any other R2 domains found to the breakdown
    for (const domain of Array.from(allR2Domains)) {
      if (!domainBreakdown[domain]) {
        domainBreakdown[domain] = 0;
      }
    }

    console.log(`📊 Diagnosis complete: ${propertiesWithImages} with images, ${propertiesWithWrongUrls} with wrong URLs, ${propertiesWithCorrectUrls} with correct URLs`);

    return NextResponse.json({
      success: true,
      message: 'R2 URL diagnosis completed',
      totalProperties: allProperties.length,
      propertiesWithImages,
      propertiesWithWrongUrls,
      propertiesWithCorrectUrls,
      domainBreakdown,
      sampleProperties,
      allR2Domains: Array.from(allR2Domains)
    });

  } catch (error) {
    console.error('Error diagnosing R2 URLs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to diagnose R2 URLs' },
      { status: 500 }
    );
  }
}
