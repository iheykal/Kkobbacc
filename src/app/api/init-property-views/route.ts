import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🔄 Starting property view migration...');
    
    // Get all properties
    const properties = await Property.find({});
    console.log(`📊 Found ${properties.length} properties to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const property of properties) {
      try {
        // Check if property already has uniqueViewCount field
        if (property.uniqueViewCount !== undefined) {
          console.log(`⏭️ Property ${property.propertyId || property._id} already has uniqueViewCount, skipping`);
          skippedCount++;
          continue;
        }
        
        // Initialize unique view tracking fields
        property.uniqueViewCount = property.viewCount || 0; // Use existing viewCount as approximation
        property.uniqueViewers = [];
        property.anonymousViewers = [];
        property.lastViewedAt = property.updatedAt || property.createdAt || new Date();
        
        await property.save();
        console.log(`✅ Migrated property ${property.propertyId || property._id}: uniqueViewCount = ${property.uniqueViewCount}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating property ${property.propertyId || property._id}:`, error);
      }
    }
    
    console.log(`🎉 Migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);
    
    return NextResponse.json({
      success: true,
      message: 'Property view migration completed',
      data: {
        totalProperties: properties.length,
        migratedCount,
        skippedCount
      }
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    );
  }
}
