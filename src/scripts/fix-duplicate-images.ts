/**
 * Script to identify and fix properties with duplicate images
 * This script will:
 * 1. Find properties where thumbnailImage appears in the images array
 * 2. Remove duplicates from the images array
 * 3. Update the database with the cleaned data
 */

import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';

export async function fixDuplicateImages() {
  try {
    console.log('🔧 Starting duplicate image fix...');
    
    // Connect to database
    await connectToDatabase();
    
    // Find all properties with images
    const properties = await Property.find({
      $or: [
        { thumbnailImage: { $exists: true, $ne: '' } },
        { images: { $exists: true, $ne: [] } }
      ]
    });
    
    console.log(`📊 Found ${properties.length} properties with images`);
    
    let fixedCount = 0;
    let duplicateCount = 0;
    
    for (const property of properties) {
      const originalImages = property.images || [];
      const thumbnail = property.thumbnailImage;
      
      // Check if thumbnail appears in images array
      const hasDuplicate = thumbnail && originalImages.includes(thumbnail);
      
      if (hasDuplicate) {
        duplicateCount++;
        console.log(`🔄 Property ${property.propertyId || property._id}: Found duplicate thumbnail in images array`);
        console.log(`   Thumbnail: ${thumbnail}`);
        console.log(`   Original images: ${originalImages.join(', ')}`);
        
        // Remove thumbnail from images array
        const cleanedImages = originalImages.filter(img => img !== thumbnail);
        
        console.log(`   Cleaned images: ${cleanedImages.join(', ')}`);
        
        // Update the property
        await Property.updateOne(
          { _id: property._id },
          { 
            $set: { 
              images: cleanedImages,
              updatedAt: new Date()
            }
          }
        );
        
        fixedCount++;
        console.log(`✅ Fixed property ${property.propertyId || property._id}`);
      }
    }
    
    console.log(`🎉 Duplicate image fix completed!`);
    console.log(`   Properties with duplicates: ${duplicateCount}`);
    console.log(`   Properties fixed: ${fixedCount}`);
    
    return {
      success: true,
      totalProperties: properties.length,
      duplicatesFound: duplicateCount,
      propertiesFixed: fixedCount
    };
    
  } catch (error) {
    console.error('❌ Error fixing duplicate images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the script if called directly
if (require.main === module) {
  fixDuplicateImages()
    .then(result => {
      console.log('Script result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

