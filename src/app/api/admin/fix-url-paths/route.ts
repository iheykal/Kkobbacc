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

    // Define the path pattern to fix
    const wrongPath = '/uploads/listings/';
    const correctPath = '/listings/';

    // Find properties with wrong path structure
    const propertiesToFix = await Property.find({
      $or: [
        // Check thumbnailImage
        { thumbnailImage: { $regex: new RegExp(wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
        // Check images array
        { images: { $regex: new RegExp(wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
      ]
    });

    console.log(`🔍 Found ${propertiesToFix.length} properties with wrong path structure`);

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
        if (property.thumbnailImage && property.thumbnailImage.includes(wrongPath)) {
          const newThumbnailImage = property.thumbnailImage.replace(wrongPath, correctPath);
          changes.oldUrl = property.thumbnailImage;
          changes.newUrl = newThumbnailImage;
          property.thumbnailImage = newThumbnailImage;
          hasChanges = true;
        }

        // Fix images array
        if (property.images && Array.isArray(property.images)) {
          const newImages = property.images.map((imageUrl: string) => {
            if (imageUrl && imageUrl.includes(wrongPath)) {
              return imageUrl.replace(wrongPath, correctPath);
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
            reason: 'No wrong path structure found in URLs'
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

    console.log(`🎯 Path structure fix completed: ${results.fixed} fixed, ${results.skipped} skipped, ${results.errors} errors`);

    return NextResponse.json({
      success: true,
      message: `Fixed path structure for ${results.fixed} properties`,
      results
    });

  } catch (error) {
    console.error('Error fixing URL paths:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix URL paths' },
      { status: 500 }
    );
  }
}
