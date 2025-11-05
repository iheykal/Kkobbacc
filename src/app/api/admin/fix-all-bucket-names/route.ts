import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import Property from '@/models/Property';
import connectToDatabase from '@/lib/mongodb';

export const runtime = 'nodejs';

/**
 * POST /api/admin/fix-all-bucket-names
 * Fix all properties with wrong bucket names
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fix all bucket names request received');
    
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

    const body = await request.json();
    const { action = 'fix_all' } = body;

    // Connect to database
    await connectToDatabase();

    const WRONG_BUCKET = '744f24f8a5918e0d996c5ff4009a7adb';
    const CORRECT_BUCKET = '126b4cc26d8041e99d7cc45ade6cfd3b';

    const results: {
      action: string;
      success: boolean;
      totalProperties: number;
      propertiesWithWrongBucket: number;
      fixed: number;
      errors: number;
      details: Array<{
        propertyId: number | undefined;
        title: string;
        changes?: any;
        status: string;
        error?: string;
        thumbnailImage?: string;
        images?: string[];
      }>;
      message: string;
    } = {
      action,
      success: false,
      totalProperties: 0,
      propertiesWithWrongBucket: 0,
      fixed: 0,
      errors: 0,
      details: [],
      message: ''
    };

    if (action === 'fix_all') {
      // Get all properties
      const allProperties = await Property.find({});
      results.totalProperties = allProperties.length;

      console.log(`🔍 Checking ${allProperties.length} properties for bucket name fixes`);

      // Find properties with wrong bucket
      const propertiesToFix = allProperties.filter(property => {
        const hasWrongThumbnail = property.thumbnailImage && property.thumbnailImage.includes(WRONG_BUCKET);
        const hasWrongImages = property.images && property.images.some(img => img.includes(WRONG_BUCKET));
        return hasWrongThumbnail || hasWrongImages;
      });

      results.propertiesWithWrongBucket = propertiesToFix.length;

      console.log(`🔍 Found ${propertiesToFix.length} properties with wrong bucket names`);

      // Fix each property
      for (const property of propertiesToFix) {
        try {
          let hasChanges = false;
          const changes: any = {};

          // Fix thumbnailImage
          if (property.thumbnailImage && property.thumbnailImage.includes(WRONG_BUCKET)) {
            const newThumbnailImage = property.thumbnailImage.replace(WRONG_BUCKET, CORRECT_BUCKET);
            changes.oldThumbnail = property.thumbnailImage;
            changes.newThumbnail = newThumbnailImage;
            property.thumbnailImage = newThumbnailImage;
            hasChanges = true;
            console.log(`🔄 Fixed thumbnail bucket name for property ${property.propertyId}`);
          }

          // Fix images array
          if (property.images && Array.isArray(property.images)) {
            const newImages = property.images.map((imageUrl: string) => {
              if (imageUrl && imageUrl.includes(WRONG_BUCKET)) {
                return imageUrl.replace(WRONG_BUCKET, CORRECT_BUCKET);
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
              console.log(`🔄 Fixed images array bucket name for property ${property.propertyId}`);
            }
          }

          if (hasChanges) {
            await property.save();
            results.fixed++;
            results.details.push({
              propertyId: property.propertyId,
              title: property.title,
              changes: changes,
              status: 'fixed'
            });
            console.log(`✅ Fixed bucket name for property ${property.propertyId}: ${property.title}`);
          } else {
            results.details.push({
              propertyId: property.propertyId,
              title: property.title,
              status: 'no_changes_needed'
            });
          }

        } catch (error) {
          results.errors++;
          results.details.push({
            propertyId: property.propertyId,
            title: property.title,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          console.error(`❌ Error fixing property ${property.propertyId}:`, error);
        }
      }

      results.success = true;
      results.message = `Fixed bucket names for ${results.fixed} properties`;

    } else if (action === 'fix_specific') {
      const { propertyId, imageUrls } = body;
      
      if (!propertyId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Property ID is required for fix_specific action' 
        }, { status: 400 });
      }

      // Find property by propertyId or _id
      let property = await Property.findOne({ propertyId: Number(propertyId) });
      if (!property) {
        property = await Property.findById(propertyId);
      }
      
      if (!property) {
        return NextResponse.json({ 
          success: false, 
          error: 'Property not found' 
        }, { status: 404 });
      }

      const updateData: any = {};
      
      if (imageUrls && imageUrls.length > 0) {
        updateData.thumbnailImage = imageUrls[0] || '';
        updateData.images = imageUrls.slice(1) || [];
      }

      // Update the property
      const updatedProperty = await Property.findByIdAndUpdate(
        property._id,
        { $set: updateData },
        { new: true }
      );

      if (updatedProperty) {
        results.success = true;
        results.message = `Fixed property ${propertyId}`;
        results.details.push({
          propertyId: updatedProperty.propertyId,
          title: updatedProperty.title,
          thumbnailImage: updatedProperty.thumbnailImage,
          images: updatedProperty.images,
          status: 'fixed'
        });
      } else {
        results.success = false;
        results.message = 'Failed to update property';
      }

    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action. Use "fix_all" or "fix_specific"' 
      }, { status: 400 });
    }

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('❌ Fix all bucket names error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fix bucket names' },
      { status: 500 }
    );
  }
}
