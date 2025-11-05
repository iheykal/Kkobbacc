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

    console.log('🔍 Debugging property queries...');

    // Test different queries
    const totalProperties = await Property.countDocuments({});
    const withThumbnail = await Property.countDocuments({ thumbnailImage: { $exists: true, $ne: '' } });
    const withImagesArray = await Property.countDocuments({ images: { $exists: true, $ne: [] } });
    
    // Query that should match properties with images
    const withEither = await Property.countDocuments({
      $or: [
        { thumbnailImage: { $exists: true, $ne: '' } },
        { images: { $exists: true, $ne: [] } }
      ]
    });
    
    const withBoth = await Property.countDocuments({
      $and: [
        { thumbnailImage: { $exists: true, $ne: '' } },
        { images: { $exists: true, $ne: [] } }
      ]
    });

    // Get sample properties
    const sampleProperties = await Property.find({
      $or: [
        { thumbnailImage: { $exists: true, $ne: '' } },
        { images: { $exists: true, $ne: [] } }
      ]
    }).select('_id title thumbnailImage images').limit(5);

    console.log(`📊 Query results: Total=${totalProperties}, WithThumbnail=${withThumbnail}, WithImagesArray=${withImagesArray}, WithEither=${withEither}, WithBoth=${withBoth}`);

    return NextResponse.json({
      success: true,
      message: 'Property query debug completed',
      totalProperties,
      withThumbnail,
      withImagesArray,
      withEither,
      withBoth,
      sampleProperties
    });

  } catch (error) {
    console.error('Error debugging property query:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to debug property query' },
      { status: 500 }
    );
  }
}
