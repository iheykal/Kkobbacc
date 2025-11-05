import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing property image linking...');
    await connectDB();

    // Check authentication
    const { getSessionFromRequest } = await import('@/lib/sessionUtils');
    const session = getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const User = (await import('@/models/User')).default;
    const currentUser = await User.findById(session.userId).select('role');
    
    if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    const fixes = [];
    let propertiesFixed = 0;

    // Get all properties
    const properties = await Property.find({}).lean();
    console.log(`🔍 Found ${properties.length} properties to check`);

    for (const property of properties) {
      let propertyFixed = false;
      const propertyFixes = [];

      // Check if property has no images
      if (!property.images || property.images.length === 0) {
        propertyFixes.push('No images array');
        propertyFixed = true;
      }

      // Check if property has no thumbnail
      if (!property.thumbnailImage) {
        propertyFixes.push('No thumbnail image');
        propertyFixed = true;
      }

      // Check if all properties have the same images (indicating a bug)
      const hasDuplicateImages = properties.some(otherProperty => 
        otherProperty._id.toString() !== property._id.toString() &&
        otherProperty.images &&
        property.images &&
        JSON.stringify(otherProperty.images) === JSON.stringify(property.images)
      );

      if (hasDuplicateImages) {
        propertyFixes.push('Has duplicate images with other properties');
        propertyFixed = true;
      }

      // Check if images are local instead of R2
      const hasLocalImages = property.thumbnailImage?.includes('localhost') || 
                            property.images?.some((img: string) => img.includes('localhost') || img.includes('/uploads/'));

      if (hasLocalImages) {
        propertyFixes.push('Has local images instead of R2 URLs');
        propertyFixed = true;
      }

      if (propertyFixed) {
        propertiesFixed++;
        fixes.push({
          propertyId: property._id,
          title: property.title,
          issues: propertyFixes,
          currentThumbnail: property.thumbnailImage,
          currentImages: property.images
        });
      }
    }

    // Get statistics
    const stats = {
      totalProperties: properties.length,
      propertiesWithIssues: propertiesFixed,
      propertiesWithImages: properties.filter(p => p.images && p.images.length > 0).length,
      propertiesWithThumbnails: properties.filter(p => p.thumbnailImage).length,
      propertiesWithR2Images: properties.filter(p => 
        p.thumbnailImage?.includes('r2.dev') || 
        p.images?.some((img: string) => img.includes('r2.dev'))
      ).length,
      propertiesWithLocalImages: properties.filter(p => 
        p.thumbnailImage?.includes('localhost') || 
        p.images?.some((img: string) => img.includes('localhost') || img.includes('/uploads/'))
      ).length
    };

    console.log(`✅ Property image linking analysis completed. Found ${propertiesFixed} properties with issues.`);

    return NextResponse.json({
      success: true,
      message: 'Property image linking analysis completed',
      fixes,
      stats,
      recommendations: [
        'Images should be uploaded BEFORE creating the property',
        'Use the property ID as listingId when uploading images',
        'Update property with uploaded image URLs after creation',
        'Ensure each property has unique images',
        'Use R2 URLs instead of local URLs',
        'Set the first uploaded image as thumbnail'
      ]
    });

  } catch (error) {
    console.error('❌ Error analyzing property image linking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze property image linking' },
      { status: 500 }
    );
  }
}
