import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { isAllowed } from '@/lib/authz/authorize';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';

export const runtime = 'nodejs';

/**
 * POST /api/properties/[id]/images
 * Attach image URLs to a property
 * Body: { images: string[], setAsThumbnail?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📸 Attach images request for property ID:', params.id);
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization
    const authResult = isAllowed({
      sessionUserId: session.userId,
      role: session.role,
      action: 'update',
      resource: 'property',
      ownerId: session.userId
    });
    
    if (!authResult.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: insufficient permissions' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const { images, setAsThumbnail = false } = body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Images array is required and must not be empty' 
      }, { status: 400 });
    }
    
    // Validate URLs
    const validUrls = images.filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });
    
    if (validUrls.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid image URLs provided' 
      }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Find property by propertyId or _id
    let property = await Property.findOne({ propertyId: Number(params.id) });
    if (!property) {
      property = await Property.findById(params.id);
    }
    
    if (!property) {
      return NextResponse.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }
    
    console.log('📸 Found property, updating images:', {
      propertyId: property.propertyId,
      currentImages: property.images?.length || 0,
      newUrls: validUrls.length,
      setAsThumbnail
    });
    
    // Set thumbnail if requested or if empty
    if (setAsThumbnail || !property.thumbnailImage) {
      property.thumbnailImage = validUrls[0];
      console.log('📸 Set thumbnail image:', validUrls[0]);
    }
    
    // Merge with existing images and deduplicate
    const existingImages = property.images || [];
    const imageSet = new Set([...existingImages, ...validUrls]);
    property.images = Array.from(imageSet);
    
    await property.save();
    
    console.log('✅ Property images updated successfully:', {
      totalImages: property.images.length,
      thumbnailSet: !!property.thumbnailImage
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully attached ${validUrls.length} images to property`,
      data: {
        propertyId: property.propertyId,
        thumbnailImage: property.thumbnailImage,
        images: property.images,
        totalImages: property.images.length
      }
    });
    
  } catch (error: any) {
    console.error('❌ Attach images error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to attach images' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/properties/[id]/images
 * Get images for a property
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📸 Get images request for property ID:', params.id);
    
    await connectToDatabase();
    
    // Find property by propertyId or _id (only if valid ObjectId)
    let property = await Property.findOne({ 
      propertyId: Number(params.id),
      deletionStatus: { $ne: 'deleted' }
    });
    if (!property && /^[0-9a-fA-F]{24}$/.test(params.id)) {
      property = await Property.findById(params.id);
      if (property && property.deletionStatus === 'deleted') {
        property = null;
      }
    }
    
    if (!property) {
      return NextResponse.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        propertyId: property.propertyId,
        thumbnailImage: property.thumbnailImage,
        images: property.images || [],
        totalImages: (property.images || []).length
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Get images error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to get images' },
      { status: 500 }
    );
  }
}
