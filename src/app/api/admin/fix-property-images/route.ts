import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing property images...');
    await connectDB();

    // Check authentication
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    const authResult = await authResponse.json();
    
    if (!authResponse.ok || !authResult.data) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = authResult.data;
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    const fixes = [];
    let propertiesFixed = 0;
    let imagesFixed = 0;

    // Get all properties
    const properties = await Property.find({}).lean();
    console.log(`🔍 Found ${properties.length} properties to check`);

    for (const property of properties) {
      let propertyFixed = false;
      const propertyFixes = [];

      // Check if property has local images that need to be converted to R2
      const hasLocalImages = property.thumbnailImage?.includes('localhost') || 
                            property.images?.some((img: string) => img.includes('localhost') || img.includes('/uploads/'));

      if (hasLocalImages) {
        // For now, we'll just log the issue and suggest manual upload
        // In a real fix, you would:
        // 1. Download the local images
        // 2. Upload them to R2
        // 3. Update the property with R2 URLs
        
        propertyFixes.push('Has local images - needs manual R2 upload');
        propertyFixed = true;
      }

      // Check if property has no images at all
      if (!property.thumbnailImage && (!property.images || property.images.length === 0)) {
        propertyFixes.push('No images found');
        propertyFixed = true;
      }

      // Check if property has R2 images but they're not accessible
      const hasR2Images = property.thumbnailImage?.includes('r2.dev') || 
                         property.images?.some((img: string) => img.includes('r2.dev'));
      
      if (hasR2Images) {
        // Test if R2 images are accessible
        const testImage = property.thumbnailImage || property.images?.[0];
        if (testImage) {
          try {
            const response = await fetch(testImage, { method: 'HEAD' });
            if (!response.ok) {
              propertyFixes.push(`R2 image not accessible: ${testImage}`);
              propertyFixed = true;
            }
          } catch (error) {
            propertyFixes.push(`R2 image fetch failed: ${testImage}`);
            propertyFixed = true;
          }
        }
      }

      if (propertyFixed) {
        propertiesFixed++;
        fixes.push({
          propertyId: property._id,
          title: property.title,
          issues: propertyFixes
        });
      }
    }

    // Get statistics
    const stats = {
      totalProperties: properties.length,
      propertiesWithIssues: propertiesFixed,
      propertiesWithR2Images: properties.filter(p => 
        p.thumbnailImage?.includes('r2.dev') || 
        p.images?.some((img: string) => img.includes('r2.dev'))
      ).length,
      propertiesWithLocalImages: properties.filter(p => 
        p.thumbnailImage?.includes('localhost') || 
        p.images?.some((img: string) => img.includes('localhost') || img.includes('/uploads/'))
      ).length,
      propertiesWithNoImages: properties.filter(p => 
        !p.thumbnailImage && (!p.images || p.images.length === 0)
      ).length
    };

    console.log(`✅ Property images analysis completed. Found ${propertiesFixed} properties with issues.`);

    return NextResponse.json({
      success: true,
      message: 'Property images analysis completed',
      fixes,
      stats,
      recommendations: [
        'Check R2 environment variables are correctly set',
        'Verify R2 bucket permissions and CORS settings',
        'Ensure image upload process is working correctly',
        'Consider re-uploading images for properties with local URLs',
        'Test R2 image accessibility from your domain'
      ]
    });

  } catch (error) {
    console.error('❌ Error analyzing property images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze property images' },
      { status: 500 }
    );
  }
}
