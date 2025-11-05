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

    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Property ID is required' 
      }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    const results = {
      totalProperties: 0,
      foundByMongoId: false,
      foundByPropertyId: false,
      foundByString: false,
      propertyData: null as any,
      allProperties: [] as any[],
      error: null as string | null
    };

    // Get all properties first
    try {
      const allProperties = await Property.find({}).select('_id propertyId title thumbnailImage images').lean();
      results.totalProperties = allProperties.length;
      results.allProperties = allProperties;
      console.log(`🔍 Found ${allProperties.length} properties in database`);
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error getting all properties';
      return NextResponse.json({
        success: false,
        message: 'Error getting all properties',
        results
      });
    }

    // Try different ways to find the property
    try {
      // Method 1: Find by MongoDB ObjectId
      try {
        const propertyByMongoId = await Property.findById(propertyId);
        if (propertyByMongoId) {
          results.foundByMongoId = true;
          results.propertyData = {
            _id: propertyByMongoId._id,
            propertyId: propertyByMongoId.propertyId,
            title: propertyByMongoId.title,
            thumbnailImage: propertyByMongoId.thumbnailImage,
            images: propertyByMongoId.images
          };
          console.log('✅ Found property by MongoDB ObjectId:', propertyByMongoId._id);
        }
      } catch (error) {
        console.log('❌ Failed to find by MongoDB ObjectId:', error);
      }

      // Method 2: Find by propertyId field
      try {
        const propertyByPropertyId = await Property.findOne({ propertyId: propertyId });
        if (propertyByPropertyId) {
          results.foundByPropertyId = true;
          if (!results.propertyData) {
            results.propertyData = {
              _id: propertyByPropertyId._id,
              propertyId: propertyByPropertyId.propertyId,
              title: propertyByPropertyId.title,
              thumbnailImage: propertyByPropertyId.thumbnailImage,
              images: propertyByPropertyId.images
            };
          }
          console.log('✅ Found property by propertyId field:', propertyByPropertyId._id);
        }
      } catch (error) {
        console.log('❌ Failed to find by propertyId field:', error);
      }

      // Method 3: Find by string match
      try {
        const propertyByString = await Property.findOne({ 
          $or: [
            { _id: propertyId },
            { propertyId: propertyId },
            { title: propertyId }
          ]
        });
        if (propertyByString) {
          results.foundByString = true;
          if (!results.propertyData) {
            results.propertyData = {
              _id: propertyByString._id,
              propertyId: propertyByString.propertyId,
              title: propertyByString.title,
              thumbnailImage: propertyByString.thumbnailImage,
              images: propertyByString.images
            };
          }
          console.log('✅ Found property by string match:', propertyByString._id);
        }
      } catch (error) {
        console.log('❌ Failed to find by string match:', error);
      }

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error finding property';
      return NextResponse.json({
        success: false,
        message: 'Error finding property',
        results
      });
    }

    console.log(`🎯 Property lookup debug completed for ${propertyId}:`, {
      totalProperties: results.totalProperties,
      foundByMongoId: results.foundByMongoId,
      foundByPropertyId: results.foundByPropertyId,
      foundByString: results.foundByString
    });

    return NextResponse.json({
      success: true,
      message: 'Property lookup debug completed',
      results
    });

  } catch (error) {
    console.error('Error debugging property lookup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to debug property lookup' },
      { status: 500 }
    );
  }
}
