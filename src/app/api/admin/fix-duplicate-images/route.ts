import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API: Starting duplicate image fix...');
    
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
    const fixedProperties: any[] = [];
    
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
        
        fixedProperties.push({
          id: property.propertyId || property._id,
          title: property.title,
          originalImages: originalImages,
          cleanedImages: cleanedImages,
          thumbnail: thumbnail
        });
        
        fixedCount++;
        console.log(`✅ Fixed property ${property.propertyId || property._id}`);
      }
    }
    
    console.log(`🎉 Duplicate image fix completed!`);
    console.log(`   Properties with duplicates: ${duplicateCount}`);
    console.log(`   Properties fixed: ${fixedCount}`);
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} properties with duplicate images`,
      data: {
        totalProperties: properties.length,
        duplicatesFound: duplicateCount,
        propertiesFixed: fixedCount,
        fixedProperties: fixedProperties
      }
    });
    
  } catch (error) {
    console.error('❌ Error fixing duplicate images:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

