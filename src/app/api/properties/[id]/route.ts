import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { isAllowed } from '@/lib/authz/authorize';
import Property from '@/models/Property';
import User from '@/models/User'; // Import User model for populate to work
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose'; // Import mongoose to check models

// Force dynamic rendering since this route uses request.cookies
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Property update request received for ID:', params.id);
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization for updating properties
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
    console.log('🔄 Update payload:', body);
    console.log('🔄 Update payload details:', {
      thumbnailImage: body.thumbnailImage,
      thumbnailImageType: typeof body.thumbnailImage,
      thumbnailImageLength: body.thumbnailImage?.length,
      images: body.images,
      imagesType: typeof body.images,
      imagesLength: body.images?.length,
      hasThumbnailImage: !!body.thumbnailImage,
      hasImages: !!body.images
    });
    
    // Connect to database
    await connectToDatabase();
    
    // Find the property - try by propertyId first, then by _id (same logic as GET endpoint)
    console.log('🔍 Searching for property with ID:', params.id);
    console.log('🔍 Attempting propertyId lookup:', parseInt(params.id));
    
    let property = await Property.findOne({ 
      propertyId: parseInt(params.id),
      deletionStatus: { $ne: 'deleted' }
    });
    
    // If not found by propertyId, try by _id only if it's a valid ObjectId
    if (!property && /^[0-9a-fA-F]{24}$/.test(params.id)) {
      console.log('🔍 PropertyId lookup failed, trying _id lookup:', params.id);
      property = await Property.findById(params.id);
      // Additional check for deleted properties when searching by _id
      if (property && property.deletionStatus === 'deleted') {
        property = null;
      }
    }
    
    if (!property) {
      console.error('❌ Property not found with ID:', params.id);
      return NextResponse.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }
    
    console.log('✅ Property found for update:', {
      _id: property._id,
      propertyId: property.propertyId,
      title: property.title
    });
    
    // Check if user owns this property or is admin
    if (property.agentId?.toString() !== session.userId && session.role !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: you can only update your own properties' 
      }, { status: 403 });
    }
    
    // Update the property
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    // Validate image data if provided
    if (updateData.thumbnailImage !== undefined) {
      if (typeof updateData.thumbnailImage !== 'string') {
        console.warn('⚠️ Invalid thumbnailImage type:', typeof updateData.thumbnailImage);
        updateData.thumbnailImage = String(updateData.thumbnailImage || '');
      }
    }
    
    if (updateData.images !== undefined) {
      if (!Array.isArray(updateData.images)) {
        console.warn('⚠️ Invalid images type:', typeof updateData.images);
        updateData.images = [];
      }
    }
    
    console.log('🔄 MongoDB update data:', updateData);
    console.log('🔄 MongoDB update data details:', {
      thumbnailImage: updateData.thumbnailImage,
      images: updateData.images,
      updateDataKeys: Object.keys(updateData)
    });
    
    const updatedProperty = await Property.findByIdAndUpdate(
      property._id, // Use the found property's _id instead of params.id
      { 
        $set: updateData
      },
      { new: true }
    );
    
    if (!updatedProperty) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update property' 
      }, { status: 500 });
    }
    
    console.log('✅ Property updated successfully:', updatedProperty._id);
    console.log('✅ Updated property image fields:', {
      thumbnailImage: updatedProperty.thumbnailImage,
      images: updatedProperty.images,
      thumbnailImageType: typeof updatedProperty.thumbnailImage,
      imagesType: typeof updatedProperty.images,
      imagesLength: updatedProperty.images?.length
    });
    
    return NextResponse.json({
      success: true,
      data: updatedProperty,
      message: 'Property updated successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Property update error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update property' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Property fetch request for ID:', params.id);
    
    // Connect to database and ensure User model is registered
    try {
      const dbConnection = await connectToDatabase();
      if (!dbConnection) {
        console.error('❌ Database connection returned null');
        return NextResponse.json(
          { success: false, error: 'Database connection failed' },
          { status: 503 }
        );
      }
      
      // Wait for connection to be ready (bufferCommands: false requires this)
      // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (mongoose.connection.readyState !== 1) {
        console.log('⏳ Waiting for MongoDB connection to be ready...');
        await new Promise<void>((resolve, reject) => {
          // Check if already connected
          if (mongoose.connection.readyState === 1) {
            resolve();
            return;
          }
          
          let timeoutId: NodeJS.Timeout | null = null;
          
          const cleanup = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            mongoose.connection.removeListener('connected', onConnected);
            mongoose.connection.removeListener('error', onError);
          };
          
          const onConnected = () => {
            console.log('✅ MongoDB connection ready');
            cleanup();
            resolve();
          };
          
          const onError = (error: any) => {
            console.error('❌ MongoDB connection error:', error);
            cleanup();
            reject(error);
          };
          
          mongoose.connection.once('connected', onConnected);
          mongoose.connection.once('error', onError);
          
          // Timeout after 10 seconds
          timeoutId = setTimeout(() => {
            if (mongoose.connection.readyState !== 1) {
              cleanup();
              reject(new Error('MongoDB connection timeout'));
            }
          }, 10000);
        });
      }
      
      console.log('✅ Database connected and ready (readyState:', mongoose.connection.readyState, ')');
      
      // Explicitly ensure User model is registered before populate
      // This is necessary for populate to work in Next.js API routes
      // Force model registration by checking if it exists
      if (!mongoose.models.User) {
        console.log('⚠️ User model not registered yet, force registering...');
        // Force re-import to ensure registration
        const UserModel = await import('@/models/User');
        // Access the default export to trigger registration
        if (UserModel.default) {
          console.log('✅ User model force-registered');
        }
      } else {
        console.log('✅ User model already registered');
      }
    } catch (dbError: any) {
      console.error('❌ Database connection error:', dbError?.message || dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? dbError?.message : undefined
        },
        { status: 503 }
      );
    }
    
    // Try to parse as number first (propertyId)
    const numericId = parseInt(params.id);
    const isValidNumber = !isNaN(numericId) && isFinite(numericId);
    
    console.log('🔍 Parsed ID:', { original: params.id, numeric: numericId, isValidNumber });
    
    let property = null;
    
    // Try to find by propertyId first if it's a valid number - exclude deleted properties
    if (isValidNumber) {
      console.log('🔍 Searching by propertyId:', numericId);
      property = await Property.findOne({ 
        propertyId: numericId,
        deletionStatus: { $ne: 'deleted' }
      })
        .populate('agentId', 'fullName phone avatar')
        .lean();
      
      if (property) {
        console.log('✅ Property found by propertyId:', property.propertyId);
      } else {
        console.log('❌ Property not found by propertyId:', numericId);
      }
    }
    
    // If not found by propertyId, try by _id only if it's a valid ObjectId - exclude deleted properties
    if (!property && /^[0-9a-fA-F]{24}$/.test(params.id)) {
      console.log('🔍 Searching by _id:', params.id);
      property = await Property.findById(params.id)
        .populate('agentId', 'fullName phone avatar')
        .lean();
      
      // Additional check for deleted properties when searching by _id
      if (property && property.deletionStatus === 'deleted') {
        console.log('❌ Property found but is deleted');
        property = null;
      }
      
      if (property) {
        console.log('✅ Property found by _id:', property._id);
      } else {
        console.log('❌ Property not found by _id:', params.id);
      }
    }
    
    if (!property) {
      console.log('❌ Property not found with ID:', params.id);
      return NextResponse.json({ 
        success: false, 
        error: `Property not found with ID: ${params.id}` 
      }, { status: 404 });
    }
    
    console.log('✅ Property found:', property._id);
    
    return NextResponse.json({
      success: true,
      data: property
    }, {
      headers: {
        // Enable caching for instant loading
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300, max-age=30',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Property fetch error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      paramsId: params.id
    });
    
    // Return 404 if it's a not found error, otherwise 500
    const statusCode = error?.message?.includes('not found') || error?.message?.includes('Property not found') 
      ? 404 
      : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to fetch property',
        details: process.env.NODE_ENV === 'development' ? {
          stack: error?.stack,
          paramsId: params.id
        } : undefined
      },
      { status: statusCode }
    );
  }
}