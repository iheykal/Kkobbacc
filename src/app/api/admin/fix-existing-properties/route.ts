import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { isAllowed } from '@/lib/authz/authorize';
import Property from '@/models/Property';
import connectToDatabase from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting fix for existing properties...');
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization - only superadmin can run this
    const normalizedRole = session.role === 'super_admin' ? 'superadmin' : session.role;
    
    console.log('🔍 Authorization check:', {
      userId: session.userId,
      role: session.role,
      normalizedRole: normalizedRole,
      isSuperadmin: normalizedRole === 'superadmin'
    });
    
    if (normalizedRole !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can run this operation',
        debug: {
          role: session.role,
          normalizedRole: normalizedRole,
          userId: session.userId
        }
      }, { status: 403 });
    }
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    // Check if Property model is available
    if (!Property) {
      throw new Error('Property model is not available');
    }
    console.log('✅ Property model is available');
    
    // Find all properties with placeholder images or empty images
    console.log('🔍 Searching for properties with placeholder images...');
    const propertiesWithPlaceholders = await Property.find({
      $or: [
        { thumbnailImage: { $regex: /picsum\.photos|placeholder|via\.placeholder/ } },
        { images: { $regex: /picsum\.photos|placeholder|via\.placeholder/ } },
        { thumbnailImage: { $in: ['', null] } },
        { images: { $size: 0 } }
      ]
    });
    
    console.log(`🔍 Found ${propertiesWithPlaceholders.length} properties with placeholder images`);
    
    const results = {
      total: propertiesWithPlaceholders.length,
      fixed: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };
    
    for (const property of propertiesWithPlaceholders) {
      try {
        console.log(`🔧 Fixing property: ${property.title} (ID: ${property._id})`);
        
        // Check what type of fix is needed
        const hasPlaceholderThumbnail = property.thumbnailImage && 
          /picsum\.photos|placeholder|via\.placeholder/.test(property.thumbnailImage);
        const hasPlaceholderImages = property.images && 
          property.images.some((img: string) => /picsum\.photos|placeholder|via\.placeholder/.test(img));
        const hasEmptyThumbnail = !property.thumbnailImage || property.thumbnailImage === '';
        const hasEmptyImages = !property.images || property.images.length === 0;
        
        let updateData: any = {
          updatedAt: new Date()
        };
        
        // Fix placeholder or empty thumbnail
        if (hasPlaceholderThumbnail || hasEmptyThumbnail) {
          updateData.thumbnailImage = ''; // Set to empty string - will show neutral placeholder
        }
        
        // Fix placeholder or empty images
        if (hasPlaceholderImages || hasEmptyImages) {
          updateData.images = []; // Set to empty array - will show neutral placeholder
        }
        
        // Update the property
        const updatedProperty = await Property.findByIdAndUpdate(
          property._id,
          { $set: updateData },
          { new: true }
        );
        
        if (updatedProperty) {
          results.fixed++;
          results.details.push({
            propertyId: property._id,
            title: property.title,
            oldThumbnail: property.thumbnailImage,
            newThumbnail: updateData.thumbnailImage || 'unchanged',
            oldImages: property.images?.length || 0,
            newImages: updateData.images?.length || 0,
            status: 'fixed',
            fixType: hasPlaceholderThumbnail || hasPlaceholderImages ? 'removed_placeholders' : 'cleared_empty_images'
          });
          console.log(`✅ Fixed property: ${property.title}`);
        } else {
          results.skipped++;
          results.details.push({
            propertyId: property._id,
            title: property.title,
            status: 'skipped',
            reason: 'Update failed'
          });
        }
        
      } catch (error) {
        results.errors++;
        results.details.push({
          propertyId: property._id,
          title: property.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ Error fixing property ${property._id}:`, error);
      }
    }
    
    console.log(`🎉 Fix completed: ${results.fixed} fixed, ${results.skipped} skipped, ${results.errors} errors`);
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${results.fixed} properties with placeholder images`,
      results
    });
    
  } catch (error: any) {
    console.error('❌ Error fixing existing properties:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fix existing properties' },
      { status: 500 }
    );
  }
}

