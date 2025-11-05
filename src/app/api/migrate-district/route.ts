import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Update all properties with the old district name to the new one
    const result = await Property.updateMany(
      { district: 'Warta Nabada (formerly Wardhigley)' },
      { $set: { district: 'Wardhiigleey' } }
    );

    console.log('Migration result:', result);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} properties from 'Warta Nabada (formerly Wardhigley)' to 'Wardhiigleey'`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
