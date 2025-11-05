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

    // Define the correct R2 domain
    const correctDomain = 'pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev';
    
    // Define wrong domains to replace
    const wrongDomains = [
      'pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev',
      'pub-36a660b428c343399354263f0c318585.r2.dev'
    ];

    // Find properties with wrong R2 URLs
    const propertiesToFix = await Property.find({
      $or: [
        // Check thumbnailImage
        { thumbnailImage: { $regex: new RegExp(wrongDomains.join('|'), 'i') } },
        // Check images array
        { images: { $regex: new RegExp(wrongDomains.join('|'), 'i') } }
      ]
    });

    console.log(`🔍 Found ${propertiesToFix.length} properties with wrong R2 URLs`);

    const results = {
      total: propertiesToFix.length,
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
        if (property.thumbnailImage) {
          let newThumbnailImage = property.thumbnailImage;
          for (const wrongDomain of wrongDomains) {
            if (newThumbnailImage.includes(wrongDomain)) {
              newThumbnailImage = newThumbnailImage.replace(wrongDomain, correctDomain);
              hasChanges = true;
              changes.oldThumbnail = property.thumbnailImage;
              changes.newThumbnail = newThumbnailImage;
            }
          }
          if (hasChanges) {
            property.thumbnailImage = newThumbnailImage;
          }
        }

        // Fix images array
        if (property.images && Array.isArray(property.images)) {
          const newImages = property.images.map((imageUrl: string) => {
            let newUrl = imageUrl;
            for (const wrongDomain of wrongDomains) {
              if (newUrl.includes(wrongDomain)) {
                newUrl = newUrl.replace(wrongDomain, correctDomain);
                hasChanges = true;
              }
            }
            return newUrl;
          });
          
          if (hasChanges) {
            changes.oldImages = [...property.images];
            changes.newImages = newImages;
            property.images = newImages;
          }
        }

        if (hasChanges) {
          await property.save();
          results.fixed++;
          results.details.push({
            propertyId: property._id,
            title: property.title,
            fixType: 'url_fix',
            ...changes
          });
          
          console.log(`✅ Fixed R2 URLs for property ${property._id}: ${property.title}`);
        } else {
          results.skipped++;
          results.details.push({
            propertyId: property._id,
            title: property.title,
            fixType: 'no_changes_needed',
            reason: 'No wrong domains found in URLs'
          });
        }
        
      } catch (error) {
        results.errors++;
        results.details.push({
          propertyId: property._id,
          title: property.title,
          error: error instanceof Error ? error.message : 'Unknown error',
          fixType: 'error'
        });
        
        console.error(`❌ Error fixing property ${property._id}:`, error);
      }
    }

    console.log(`🎯 R2 URL fix completed: ${results.fixed} fixed, ${results.skipped} skipped, ${results.errors} errors`);

    return NextResponse.json({
      success: true,
      message: `Fixed R2 URLs for ${results.fixed} properties`,
      results
    });

  } catch (error) {
    console.error('Error fixing R2 URLs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix R2 URLs' },
      { status: 500 }
    );
  }
}
