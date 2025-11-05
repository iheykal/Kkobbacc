import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug API: Request received');
    await connectDB();
    console.log('🔍 Debug API: Database connected');
    
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    
    console.log('🔍 Debug API: Property ID from params:', propertyId);
    
    if (!propertyId) {
      console.log('❌ Debug API: No property ID provided');
      return NextResponse.json({ 
        success: false, 
        error: 'Property ID is required' 
      }, { status: 400 });
    }
    
    // Find property by propertyId or _id
    console.log('🔍 Debug API: Searching for property with propertyId:', parseInt(propertyId));
    let property = await Property.findOne({ 
      propertyId: parseInt(propertyId),
      deletionStatus: { $ne: 'deleted' }
    }).lean();
    
    console.log('🔍 Debug API: Property found by propertyId:', !!property);
    
    if (!property) {
      console.log('🔍 Debug API: Searching for property with _id:', propertyId);
      property = await Property.findById(propertyId).lean();
      console.log('🔍 Debug API: Property found by _id:', !!property);
    }
    
    if (!property) {
      console.log('❌ Debug API: Property not found');
      return NextResponse.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }
    
    console.log('✅ Debug API: Property found:', property._id);
    
    // Comprehensive image analysis
    const imageAnalysis = {
      propertyId: property.propertyId,
      _id: property._id,
      thumbnailImage: {
        value: property.thumbnailImage,
        type: typeof property.thumbnailImage,
        length: property.thumbnailImage?.length,
        isEmpty: !property.thumbnailImage || property.thumbnailImage.trim() === '',
        isR2Url: property.thumbnailImage?.includes('r2.dev') || property.thumbnailImage?.includes('r2.cloudflarestorage.com'),
        isWebP: property.thumbnailImage?.endsWith('.webp'),
        isLocal: property.thumbnailImage?.startsWith('/uploads/'),
        isExternal: property.thumbnailImage?.startsWith('http'),
      },
      images: {
        value: property.images,
        type: typeof property.images,
        isArray: Array.isArray(property.images),
        length: property.images?.length || 0,
        isEmpty: !property.images || property.images.length === 0,
        items: property.images?.map((img, index) => ({
          index,
          value: img,
          type: typeof img,
          length: img?.length,
          isEmpty: !img || img.trim() === '',
          isR2Url: img?.includes('r2.dev') || img?.includes('r2.cloudflarestorage.com'),
          isWebP: img?.endsWith('.webp'),
          isLocal: img?.startsWith('/uploads/'),
          isExternal: img?.startsWith('http'),
        })) || []
      },
      allImageFields: {
        thumbnailImage: property.thumbnailImage,
        images: property.images,
      },
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      agentId: property.agentId,
      title: property.title,
      location: property.location,
      district: property.district,
      price: property.price,
      status: property.status,
      deletionStatus: property.deletionStatus,
      expiresAt: property.expiresAt,
      isExpired: property.isExpired
    };
    
    // Test image URL resolution
    const { getAllImageUrls, getPrimaryImageUrl } = await import('@/lib/imageUrlResolver');
    const resolvedUrls = getAllImageUrls(property);
    const primaryUrl = getPrimaryImageUrl(property);
    
    const resolutionTest = {
      resolvedUrls: {
        count: resolvedUrls.length,
        urls: resolvedUrls,
        details: resolvedUrls.map((url, index) => ({
          index,
          url,
          type: typeof url,
          length: url?.length,
          isR2Url: url?.includes('r2.dev') || url?.includes('r2.cloudflarestorage.com'),
          isWebP: url?.endsWith('.webp'),
          isLocal: url?.startsWith('/uploads/'),
          isExternal: url?.startsWith('http'),
        }))
      },
      primaryUrl: {
        value: primaryUrl,
        type: typeof primaryUrl,
        length: primaryUrl?.length,
        isEmpty: !primaryUrl || primaryUrl.trim() === '',
        isR2Url: primaryUrl?.includes('r2.dev') || primaryUrl?.includes('r2.cloudflarestorage.com'),
        isWebP: primaryUrl?.endsWith('.webp'),
        isLocal: primaryUrl?.startsWith('/uploads/'),
        isExternal: primaryUrl?.startsWith('http'),
      }
    };
    
    return NextResponse.json({
      success: true,
      data: {
        imageAnalysis,
        resolutionTest,
        summary: {
          hasThumbnailImage: !!property.thumbnailImage,
          hasImagesArray: !!property.images && property.images.length > 0,
          totalResolvedUrls: resolvedUrls.length,
          hasPrimaryUrl: !!primaryUrl,
          allFieldsEmpty: !property.thumbnailImage && (!property.images || property.images.length === 0),
          hasAnyImages: !!property.thumbnailImage || (property.images && property.images.length > 0)
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Debug property images error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to debug property images' },
      { status: 500 }
    );
  }
}
