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

    // Get ALL properties with images (no regex filtering)
    const allProperties = await Property.find({
      $or: [
        { thumbnailImage: { $exists: true, $ne: '' } },
        { images: { $exists: true, $ne: [] } }
      ]
    });

    console.log(`🔍 Checking ${allProperties.length} properties for URL path fixes`);

    const results = {
      totalProperties: allProperties.length,
      fixed: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Check and fix each property
    for (const property of allProperties) {
      try {
        let hasChanges = false;
        const changes: any = {};

        // Fix thumbnailImage
        if (property.thumbnailImage && property.thumbnailImage.includes('/uploads/listings/')) {
          const newThumbnailImage = property.thumbnailImage.replace('/uploads/listings/', '/listings/');
          changes.oldUrl = property.thumbnailImage;
          changes.newUrl = newThumbnailImage;
          property.thumbnailImage = newThumbnailImage;
          hasChanges = true;
          console.log(`🔄 Fixed thumbnail URL for property ${property._id}`);
        }

        // Fix images array
        if (property.images && Array.isArray(property.images)) {
          const newImages = property.images.map((imageUrl: string) => {
            if (imageUrl && imageUrl.includes('/uploads/listings/')) {
              return imageUrl.replace('/uploads/listings/', '/listings/');
            }
            return imageUrl;
          });
          
          // Check if any images were changed
          const hasImageChanges = newImages.some((newUrl, index) => newUrl !== property.images[index]);
          
          if (hasImageChanges) {
            changes.oldImages = [...property.images];
            changes.newImages = newImages;
            property.images = newImages;
            hasChanges = true;
            console.log(`🔄 Fixed images array for property ${property._id}`);
          }
        }

        if (hasChanges) {
          await property.save();
          results.fixed++;
          results.details.push({
            propertyId: property._id,
            propertyTitle: property.title,
            fixType: 'path_fix',
            ...changes
          });
          
          console.log(`✅ Fixed path structure for property ${property._id}: ${property.title}`);
        } else {
          results.skipped++;
          results.details.push({
            propertyId: property._id,
            propertyTitle: property.title,
            fixType: 'no_changes_needed',
            reason: 'No /uploads/listings/ found in URLs'
          });
        }
        
      } catch (error) {
        results.errors++;
        results.details.push({
          propertyId: property._id,
          propertyTitle: property.title,
          error: error instanceof Error ? error.message : 'Unknown error',
          fixType: 'error'
        });
        
        console.error(`❌ Error fixing property ${property._id}:`, error);
      }
    }

    console.log(`🎯 Simple path fix completed: ${results.fixed} fixed, ${results.skipped} skipped, ${results.errors} errors`);

    return NextResponse.json({
      success: true,
      message: `Fixed path structure for ${results.fixed} properties`,
      results
    });

  } catch (error) {
    console.error('Error fixing URL paths (simple):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix URL paths' },
      { status: 500 }
    );
  }
}
