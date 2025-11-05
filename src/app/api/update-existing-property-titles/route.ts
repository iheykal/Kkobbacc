import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🔄 Starting existing property title enhancement...');
    
    // Get all active properties
    const allProperties = await Property.find({ 
      deletionStatus: { $ne: 'deleted' } 
    }).select('_id propertyId title listingType');
    
    console.log(`📋 Found ${allProperties.length} active properties to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Update each property's title
    for (const property of allProperties) {
      try {
        const currentTitle = property.title;
        const listingType = property.listingType;
        
        // Check if title already has the correct suffix
        let needsUpdate = false;
        let enhancedTitle = currentTitle;
        
        if (listingType === 'rent' && !currentTitle.includes('Kiro ah')) {
          // Remove any existing suffix first, then add rent suffix
          const cleanTitle = currentTitle
            .replace(/\s+(Kiro ah|iib ah)$/g, '')
            .trim();
          enhancedTitle = `${cleanTitle} Kiro ah`;
          needsUpdate = true;
        } else if (listingType === 'sale' && !currentTitle.includes('iib ah')) {
          // Remove any existing suffix first, then add sale suffix
          const cleanTitle = currentTitle
            .replace(/\s+(Kiro ah|iib ah)$/g, '')
            .trim();
          enhancedTitle = `${cleanTitle} iib ah`;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await Property.findByIdAndUpdate(property._id, {
            title: enhancedTitle
          });
          
          updatedCount++;
          console.log(`✅ Updated property ${property.propertyId}: "${currentTitle}" → "${enhancedTitle}"`);
        } else {
          skippedCount++;
          console.log(`⏭️ Skipped property ${property.propertyId}: "${currentTitle}" (already has correct suffix)`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating property ${property._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`🎯 Property title enhancement completed: ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`);
    
    // Get updated property list for verification
    const updatedProperties = await Property.find({ 
      deletionStatus: { $ne: 'deleted' } 
    })
    .select('propertyId title listingType')
    .limit(10);
    
    return NextResponse.json({
      success: true,
      message: `Property title enhancement completed`,
      data: {
        totalProperties: allProperties.length,
        updatedCount,
        skippedCount,
        errorCount,
        sampleProperties: updatedProperties.map(property => ({
          propertyId: property.propertyId,
          title: property.title,
          listingType: property.listingType
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error in property title enhancement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
