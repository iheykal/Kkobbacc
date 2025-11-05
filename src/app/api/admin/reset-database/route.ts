import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import Counter from '@/models/Counter';

export async function POST(req: NextRequest) {
  try {
    console.log('🧹 Starting database reset for production...');
    
    // Connect to database
    await connectDB();
    
    // Delete all properties
    const deleteResult = await Property.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} properties`);
    
    // Reset property counter to start from 1
    await Counter.findOneAndUpdate(
      { name: 'propertyId' },
      { sequence: 0 }, // This will make the next property ID = 1
      { 
        upsert: true,
        setDefaultsOnInsert: true 
      }
    );
    console.log('🔄 Reset property counter to start from ID: 1');
    
    // Verify the reset
    const remainingProperties = await Property.countDocuments({});
    const counter = await Counter.findOne({ name: 'propertyId' });
    
    console.log('✅ Database reset completed successfully');
    console.log(`📊 Remaining properties: ${remainingProperties}`);
    console.log(`🔢 Next property ID will be: ${(counter?.sequence || 0) + 1}`);
    
    return NextResponse.json({
      success: true,
      message: 'Database reset completed successfully',
      deletedProperties: deleteResult.deletedCount,
      remainingProperties,
      nextPropertyId: (counter?.sequence || 0) + 1
    });
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database reset endpoint. Use POST to reset the database for production.',
    warning: 'This will delete ALL properties and reset the property ID counter!'
  });
}
