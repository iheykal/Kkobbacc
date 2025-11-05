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
      propertyFound: false,
      updateSuccess: false,
      verificationSuccess: false,
      propertyData: null as any,
      updateDetails: null as any,
      error: null as string | null
    };

    // Step 1: Find the property
    try {
      const property = await Property.findById(propertyId);
      if (property) {
        results.propertyFound = true;
        results.propertyData = {
          _id: property._id,
          title: property.title,
          thumbnailImage: property.thumbnailImage,
          images: property.images
        };
        console.log('✅ Property found:', property._id);
      } else {
        results.error = 'Property not found';
        return NextResponse.json({
          success: false,
          message: 'Property not found',
          results
        });
      }
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error finding property';
      return NextResponse.json({
        success: false,
        message: 'Error finding property',
        results
      });
    }

    // Step 2: Test property update with sample image URLs
    try {
      const sampleImageUrls = [
        'https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/kobac-real-estate/uploads/listings/test/thumbnail.jpg',
        'https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/kobac-real-estate/uploads/listings/test/image1.jpg',
        'https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/kobac-real-estate/uploads/listings/test/image2.jpg'
      ];

      const updatePayload = {
        thumbnailImage: sampleImageUrls[0],
        images: sampleImageUrls.slice(1)
      };

      console.log('🔄 Testing property update with payload:', updatePayload);

      // Update the property
      const updatedProperty = await Property.findByIdAndUpdate(
        propertyId,
        { 
          $set: {
            ...updatePayload,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (updatedProperty) {
        results.updateSuccess = true;
        results.updateDetails = {
          payload: updatePayload,
          status: '200',
          ok: true
        };
        console.log('✅ Property update successful');
      } else {
        results.error = 'Failed to update property';
        return NextResponse.json({
          success: false,
          message: 'Failed to update property',
          results
        });
      }
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error updating property';
      return NextResponse.json({
        success: false,
        message: 'Error updating property',
        results
      });
    }

    // Step 3: Verify the update
    try {
      const verificationProperty = await Property.findById(propertyId);
      if (verificationProperty) {
        results.verificationSuccess = true;
        results.propertyData = {
          _id: verificationProperty._id,
          title: verificationProperty.title,
          thumbnailImage: verificationProperty.thumbnailImage,
          images: verificationProperty.images
        };
        console.log('✅ Property update verification successful');
      } else {
        results.error = 'Property not found after update';
        return NextResponse.json({
          success: false,
          message: 'Property not found after update',
          results
        });
      }
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error verifying update';
      return NextResponse.json({
        success: false,
        message: 'Error verifying update',
        results
      });
    }

    console.log(`🎯 Property update test completed for ${propertyId}:`, {
      propertyFound: results.propertyFound,
      updateSuccess: results.updateSuccess,
      verificationSuccess: results.verificationSuccess
    });

    return NextResponse.json({
      success: true,
      message: 'Property update test completed',
      results
    });

  } catch (error) {
    console.error('Error testing property update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test property update' },
      { status: 500 }
    );
  }
}
