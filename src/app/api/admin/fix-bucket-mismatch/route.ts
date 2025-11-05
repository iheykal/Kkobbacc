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

    // Define the bucket names
    const wrongBucket = 'kobac252';
    const correctBucket = 'kobac-property-uploads';

    // Find properties with wrong bucket name in URLs
    const propertiesToFix = await Property.find({
      $or: [
        // Check thumbnailImage
        { thumbnailImage: { $regex: new RegExp(wrongBucket, 'i') } },
        // Check images array
        { images: { $regex: new RegExp(wrongBucket, 'i') } }
      ]
    });

    console.log(`🔍 Found ${propertiesToFix.length} properties with wrong bucket name`);

    const results = {
      totalProperties: propertiesToFix.length,
      fixed: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Fix each property
    for (const property of propertiesToFix) {
      try {
        let hasChanges = false;
        const changes: any = {};

        // Fix thumbnailImage
        if (property.thumbnailImage && property.thumbnailImage.includes(wrongBucket)) {
          const newThumbnailImage = property.thumbnailImage.replace(wrongBucket, correctBucket);
          changes.oldUrl = property.thumbnailImage;
          changes.newUrl = newThumbnailImage;
          property.thumbnailImage = newThumbnailImage;
          hasChanges = true;
        }

        // Fix images array
        if (property.images && Array.isArray(property.images)) {
          const newImages = property.images.map((imageUrl: string) => {
            if (imageUrl && imageUrl.includes(wrongBucket)) {
              return imageUrl.replace(wrongBucket, correctBucket);
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
          }
        }

        if (hasChanges) {
          await property.save();
          results.fixed++;
          results.details.push({
            propertyId: property._id,
            propertyTitle: property.title,
            fixType: 'bucket_fix',
            ...changes
          });
          
          console.log(`✅ Fixed bucket name for property ${property._id}: ${property.title}`);
        } else {
          results.skipped++;
          results.details.push({
            propertyId: property._id,
            propertyTitle: property.title,
            fixType: 'no_changes_needed',
            reason: 'No wrong bucket names found in URLs'
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

    console.log(`🎯 Bucket mismatch fix completed: ${results.fixed} fixed, ${results.skipped} skipped, ${results.errors} errors`);

    return NextResponse.json({
      success: true,
      message: `Fixed bucket mismatch for ${results.fixed} properties`,
      results
    });

  } catch (error) {
    console.error('Error fixing bucket mismatch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix bucket mismatch' },
      { status: 500 }
    );
  }
}
