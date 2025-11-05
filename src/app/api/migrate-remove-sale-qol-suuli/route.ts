import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { getSessionFromRequest } from '@/lib/sessionUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting QOL/Suuli removal for For Sale properties...');
    await connectDB();
    console.log('✅ Connected to database.');

    // For migration purposes, we'll allow this without authentication
    // In production, you might want to add a special migration token
    console.log('⚠️ Running migration without authentication (development mode)');

    console.log('🔄 Removing QOL and Suuli from all For Sale properties...');

    // Find all For Sale properties first to see what we're working with
    const forSaleProperties = await Property.find({ 
      $or: [
        { status: 'For Sale' },
        { status: 'for sale' },
        { status: 'for-sale' },
        { listingType: 'sale' }
      ]
    }).select('_id propertyId title status listingType beds baths');

    console.log(`📊 Found ${forSaleProperties.length} For Sale properties to update`);

    if (forSaleProperties.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No For Sale properties found to update.',
        matchedCount: 0,
        modifiedCount: 0
      });
    }

    // Log some examples before update
    console.log('📋 Sample properties before update:', forSaleProperties.slice(0, 3).map(p => ({
      id: p._id,
      title: p.title,
      status: p.status,
      listingType: p.listingType,
      beds: p.beds,
      baths: p.baths
    })));

    // Update all For Sale properties to set beds and baths to 0
    const result = await Property.updateMany(
      { 
        $or: [
          { status: 'For Sale' },
          { status: 'for sale' },
          { status: 'for-sale' },
          { listingType: 'sale' }
        ]
      },
      { 
        $set: { 
          beds: 0,
          baths: 0
        } 
      }
    );

    console.log('✅ Update complete:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

    // Verify the update by checking a few properties
    const updatedProperties = await Property.find({ 
      $or: [
        { status: 'For Sale' },
        { status: 'for sale' },
        { status: 'for-sale' },
        { listingType: 'sale' }
      ]
    }).select('_id propertyId title status listingType beds baths').limit(3);

    console.log('📋 Sample properties after update:', updatedProperties.map(p => ({
      id: p._id,
      title: p.title,
      status: p.status,
      listingType: p.listingType,
      beds: p.beds,
      baths: p.baths
    })));

    if (result.modifiedCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Successfully removed QOL and Suuli from ${result.modifiedCount} For Sale properties. All For Sale properties now have beds=0 and baths=0.`,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        sampleUpdated: updatedProperties.map(p => ({
          id: p._id,
          title: p.title,
          beds: p.beds,
          baths: p.baths
        }))
      });
    } else {
      return NextResponse.json({
        success: true,
        message: `No For Sale properties were modified. All For Sale properties already have beds=0 and baths=0.`,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });
    }

  } catch (error) {
    console.error('❌ Error during QOL/Suuli removal:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to remove QOL/Suuli from For Sale properties: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}
