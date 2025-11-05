import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property, { IProperty } from '@/models/Property';
import User, { UserRole } from '@/models/User';
import { SortOrder, Types } from 'mongoose';

// Define types for Property with populated agentId
type PropertyWithPopulatedAgent = Omit<IProperty, 'agentId'> & {
  agentId: Types.ObjectId | {
    _id: Types.ObjectId;
    name: string;
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    profile?: {
      avatar?: string;
    };
    agentProfile?: {
      verified?: boolean;
    };
  } | string;
};

type PropertyDocument = PropertyWithPopulatedAgent & {
  toObject(): any;
};
import { getNextPropertyId } from '@/lib/propertyIdGenerator';
import { getCompanyLogoUrl, DEFAULT_AVATAR_URL } from '@/lib/utils';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { isAllowed, createListFilter, enforceOwnership, sanitizeUpdateData } from '@/lib/authz/authorize';

// Enable caching with revalidation for better performance
export const revalidate = 60; // Cache for 60 seconds

/**
 * Property API Routes
 * 
 * Features:
 * - Automatic company logo attachment: When agents post properties, 
 *   the company logo is automatically appended to the images array
 * - Company logo URL: /icons/kobac.webp (KOBAC company logo)
 */

export async function GET(request: NextRequest) {
  try {
    // Connect to database with error handling
    try {
      await connectDB();
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }
    
    // Get session for authorization (optional for public property viewing)
    let session;
    try {
      session = getSessionFromRequest(request);
    } catch (sessionError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Session retrieval error (continuing as anonymous):', sessionError);
      }
      session = null;
    }
    
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort'); // e.g., 'latest'
    const agentId = searchParams.get('agentId');
    const listingType = searchParams.get('listingType');
    const district = searchParams.get('district');
    
    // Reduced logging for better performance - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 GET /api/properties - Query:', { featured, limit, agentId, listingType, district });
    }
    
     // Check if this is an admin request (superadmin can see all properties)
     const isAdminRequest = request.headers.get('x-admin-request') === 'true';
     const isSuperadmin = session && (session.role === 'superadmin' || session.role === 'super_admin');
     
     // Create base query with authorization filter
     // For superadmins and admin requests: show all properties (including expired/pending)
     // For regular users: show only public properties (active, not expired, not deleted)
     let query: any = {};
     
     // Only apply visibility filters for non-admin users
     if (!isSuperadmin && !isAdminRequest) {
       const now = new Date();
       query.deletionStatus = { $nin: ['deleted', 'pending_deletion'] }; // Exclude deleted and pending deletion
       
       // STRICT expiration filter: Property must NOT be expired
       // A property is expired if:
       //   1. isExpired === true, OR
       //   2. expiresAt exists AND expiresAt < now
       //
       // We need to INCLUDE only properties where:
       // - isExpired !== true (or doesn't exist), AND
       // - expiresAt >= now (if it exists) OR expiresAt doesn't exist
       //
       // We use $and to ensure BOTH conditions must be met
       query.$and = (query.$and || []).concat([
         {
           // Condition 1: isExpired must not be true
           $or: [
             { isExpired: { $ne: true } },
             { isExpired: { $exists: false } }
           ]
         },
         {
           // Condition 2: expiresAt must be >= now (if it exists) OR doesn't exist
           $or: [
             { expiresAt: { $gte: now } },
             { expiresAt: { $exists: false } }
           ]
         }
       ]);
       
       // CRITICAL: Also use $nor to explicitly exclude expired properties
       // This ensures properties with isExpired=true OR expiresAt<now are excluded
       query.$nor = [
         { isExpired: true },
         { expiresAt: { $lt: now } }
       ];
       
       if (process.env.NODE_ENV === 'development') {
         console.log('🔍 Public query - STRICT expiration filter (using $nor + $and):', {
           now: now.toISOString(),
           nowTimestamp: now.getTime(),
           filters: {
             deletionStatus: 'not deleted/pending',
             isExpired: 'not true',
             expiresAt: '>= now OR doesn\'t exist',
             excludeIf: 'isExpired=true OR expiresAt<now'
           },
           query: JSON.stringify(query, null, 2)
         });
       }
     } else {
       // For superadmins/admin requests: only exclude actually deleted properties
       query.deletionStatus = { $ne: 'deleted' };
       if (process.env.NODE_ENV === 'development') {
         console.log('🔍 Admin/Superadmin request - showing all properties including expired and pending');
       }
     }
    
    // Apply authorization filter only if user is authenticated
    if (session) {
      try {
        const authFilter = createListFilter(session.role, 'read', 'property', session.userId);
        // Only merge authFilter if it's not empty (empty object means user can see all)
        if (authFilter && Object.keys(authFilter).length > 0) {
        query = { ...query, ...authFilter };
        }
      } catch (authError) {
        console.error('❌ Authorization filter creation error:', authError);
        // Fallback to anonymous query on auth error
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Falling back to anonymous user query');
        }
      }
    } else {
      // For anonymous users, show all public properties (no additional filter needed)
      // The base query already filters out deleted properties and expired ones
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Anonymous user - showing all public properties');
      }
    }
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    if (agentId) {
      query.agentId = agentId;
      // For agent dashboard requests or admin requests, show all properties (including pending deletion)
      // For public agent profile views, the base query already filters out deleted and expired
      if (request.headers.get('x-agent-dashboard') || isAdminRequest || isSuperadmin) {
        // Remove deletionStatus filter for dashboard/admin (agents/admins can see their pending deletions)
        // Only exclude actually deleted properties
        query.deletionStatus = { $ne: 'deleted' };
        // Remove expiration filter for dashboard/admin (agents/admins can see expired properties)
        // Only remove expiration-related conditions, not all $and conditions
        if (query.$and) {
          query.$and = query.$and.filter((condition: any) => {
            // Check if this condition is about isExpired or expiresAt
            if (condition.$or && Array.isArray(condition.$or)) {
              const hasExpirationFilter = condition.$or.some((orCond: any) => 
                orCond.isExpired !== undefined || orCond.expiresAt !== undefined
              );
              return !hasExpirationFilter;
            }
            return true;
          });
          // If $and is now empty, remove it
          if (query.$and.length === 0) {
            delete query.$and;
          }
        }
        // Remove $nor expiration filter
        if (query.$nor) {
          delete query.$nor;
        }
        if (query.$or) {
          delete query.$or;
        }
      }
      // For public views, base query already has correct filters - no changes needed
    }
    
    if (listingType) {
      query.listingType = listingType;
    }
    
    if (district) {
      query.district = district;
    }
    
    // Optimize query for dashboard loading
    const isDashboardRequest = limit <= 10; // Dashboard requests are small
    const isMobileOptimized = request.headers.get('x-mobile-optimized') === 'true';
    
    // Determine sort order: default by engagement, or latest first if requested
    const sortOption: Record<string, SortOrder> = sort === 'latest' 
      ? { createdAt: -1 }
      : { uniqueViewCount: -1, createdAt: -1 };

    // Mobile-optimized field selection
    // Include description for search functionality, images for gallery, and other essential fields
    const selectFields = isMobileOptimized 
      ? 'propertyId title location district price beds baths sqft propertyType listingType measurement status description features amenities thumbnailImage images agentId createdAt viewCount uniqueViewCount deletionStatus expiresAt isExpired'
      : 'propertyId title location district price beds baths sqft yearBuilt lotSize propertyType listingType measurement status description features amenities thumbnailImage images agentId createdAt viewCount uniqueViewCount agent deletionStatus expiresAt isExpired';

    let propertiesQuery;
    try {
      propertiesQuery = Property.find(query)
        .select(selectFields)
        .sort(sortOption)
        .lean(); // Use lean() for better performance - returns plain JavaScript objects
      
      // Only populate agent data for non-dashboard requests to improve performance
      // Limit populated fields to essential data only for faster queries
      if (!isDashboardRequest) {
        propertiesQuery = propertiesQuery.populate('agentId', 'fullName phone profile.avatar');
      }
      
      if (!agentId) {
        propertiesQuery = propertiesQuery.limit(limit);
      }
    } catch (queryError) {
      console.error('❌ Query construction error:', queryError);
      throw new Error(`Query construction failed: ${queryError instanceof Error ? queryError.message : String(queryError)}`);
    }
    
    let properties: any[] = [];
    try {
      // Execute query with lean() for performance
      const queryResult = await propertiesQuery;
      // Ensure properties is always an array
      if (!Array.isArray(queryResult)) {
        console.error('❌ Query returned non-array result:', typeof queryResult);
        properties = [];
      } else {
        properties = queryResult;
      }
    } catch (queryExecError) {
      console.error('❌ Query execution error:', queryExecError);
      throw new Error(`Query execution failed: ${queryExecError instanceof Error ? queryExecError.message : String(queryExecError)}`);
    }
    
    // MongoDB query already handles all filtering efficiently - no need for post-query filtering
    // The query includes proper expiration and deletion status filters
    // This removes expensive JavaScript filtering that was redundant
    
    // Only do expensive count queries for admin requests (not needed for regular users)
    // These queries are expensive and slow down the API response
    if ((isAdminRequest || isSuperadmin) && process.env.NODE_ENV === 'development') {
      const now = new Date();
      const totalPropertiesInDB = await Property.countDocuments({});
      const activePropertiesInDB = await Property.countDocuments({ 
        deletionStatus: { $nin: ['deleted', 'pending_deletion'] },
        $and: [
          {
            $or: [
              { isExpired: { $ne: true } },
              { isExpired: { $exists: false } }
            ]
          },
          {
            $or: [
              { expiresAt: { $gte: now } },
              { expiresAt: { $exists: false } }
            ]
          }
        ]
      });
      const deletedPropertiesInDB = await Property.countDocuments({ deletionStatus: 'deleted' });
      const pendingDeletionInDB = await Property.countDocuments({ deletionStatus: 'pending_deletion' });
      const expiredPropertiesInDB = await Property.countDocuments({ 
        $or: [
          { isExpired: true },
          { expiresAt: { $lt: now } }
        ],
        deletionStatus: { $ne: 'deleted' }
      });
      
      console.log('🔍 GET /api/properties - Admin query results:', {
        totalPropertiesFound: properties.length,
        totalPropertiesInDB,
        activePropertiesInDB,
        deletedPropertiesInDB,
        pendingDeletionInDB,
        expiredPropertiesInDB
      });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('🔍 GET /api/properties - Query results:', {
        totalPropertiesFound: properties.length,
        limit: limit,
        isDashboardRequest,
        queryFilters: {
          deletionStatus: query.deletionStatus,
          hasExpirationFilter: !!query.$nor
        }
      });
    }
    
    // Process properties to ensure consistent agent data
    // Since we're using .lean(), properties are already plain objects
    // Use populated agentId data directly - no async loops needed
    let processedProperties: any[];
    
    try {
      // Process properties synchronously using populated data (much faster)
      processedProperties = properties.map((property) => {
        // .lean() already returns plain objects, no need for toObject()
        const propertyObj = property as any;
      
      // Store the original agentId as a string for navigation - CRITICAL for proper navigation
      let originalAgentId: string | null = null;
      if (propertyObj.agentId) {
        if (typeof propertyObj.agentId === 'object' && propertyObj.agentId !== null) {
          // Handle populated agent object - extract _id safely
          const agentObj = propertyObj.agentId as any;
          if (agentObj._id) {
            // Has _id property
            originalAgentId = typeof agentObj._id === 'string' 
              ? agentObj._id 
              : agentObj._id.toString?.() || String(agentObj._id);
          } else if (agentObj.id) {
            // Has id property
            originalAgentId = typeof agentObj.id === 'string' 
              ? agentObj.id 
              : String(agentObj.id);
          } else {
            // Try to extract any ID-like property
            const possibleId = agentObj.id || agentObj._id || agentObj.userId || agentObj.agentId;
            if (possibleId) {
              originalAgentId = typeof possibleId === 'string' 
                ? possibleId 
                : possibleId.toString?.() || String(possibleId);
            }
          }
          
          // Validate extracted ID is not [object Object]
          if (originalAgentId && (originalAgentId === '[object Object]' || originalAgentId.includes('object Object'))) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Extracted agentId is [object Object], property:', propertyObj.propertyId || propertyObj._id);
            }
            originalAgentId = null;
          }
        } else if (typeof propertyObj.agentId === 'string') {
          // Handle string ID - validate it's not [object Object]
          if (propertyObj.agentId === '[object Object]' || propertyObj.agentId.includes('object Object')) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ agentId is [object Object] string, property:', propertyObj.propertyId || propertyObj._id);
            }
            originalAgentId = null;
          } else {
          originalAgentId = propertyObj.agentId;
          }
        } else {
          // Handle ObjectId or any other type - convert to string
          const stringId = String(propertyObj.agentId);
          if (stringId === '[object Object]' || stringId.includes('object Object')) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ agentId converted to [object Object], property:', propertyObj.propertyId || propertyObj._id);
            }
            originalAgentId = null;
          } else {
            originalAgentId = stringId;
          }
        }
      }
      
      // CRITICAL: Ensure originalAgentId is set even if agentId is an object
      // This prevents navigation issues where agentId is an object
      if (!originalAgentId && propertyObj.agentId && typeof propertyObj.agentId === 'object') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Failed to extract agentId from object, property:', propertyObj.propertyId || propertyObj._id, 'agentId:', propertyObj.agentId);
        }
      }
      
      // Use populated agentId data directly (no async fetch needed)
      // Since we're populating agentId for non-dashboard requests, we can use it directly
      if (propertyObj.agentId && typeof propertyObj.agentId === 'object' && '_id' in propertyObj.agentId) {
        // Use populated agent data directly
        const agentData = propertyObj.agentId as any;
        const agentAvatar = agentData.avatar || agentData.profile?.avatar;
        
        // Build agent name from available fields - prioritize fullName
        let agentName = agentData.fullName;
        if (!agentName || agentName.trim() === '') {
          const firstName = agentData.firstName || '';
          const lastName = agentData.lastName || '';
          agentName = `${firstName} ${lastName}`.trim();
        }
        if (!agentName || agentName.trim() === '') {
          agentName = 'Agent';
        }
        
        propertyObj.agent = {
          name: agentName,
          phone: agentData.phone || 'N/A',
          image: agentAvatar || DEFAULT_AVATAR_URL,
          rating: 5.0
        };
      } else {
        // Fallback to embedded agent data if no populated agentId
        propertyObj.agent = {
          name: propertyObj.agent?.name || 'Agent',
          phone: propertyObj.agent?.phone || 'N/A',
          image: propertyObj.agent?.image || DEFAULT_AVATAR_URL,
          rating: propertyObj.agent?.rating || 5.0
        };
      }
      
      // CRITICAL: Always set agentId as a string, never as an object
      // This prevents navigation issues where agentId becomes [object Object]
      if (originalAgentId) {
        propertyObj.agentId = originalAgentId;
      } else if (propertyObj.agentId && typeof propertyObj.agentId === 'object') {
        // Last resort: try to extract ID from object one more time
        const agentObj = propertyObj.agentId as any;
        const extractedId = agentObj._id?.toString?.() || agentObj.id?.toString?.() || agentObj._id || agentObj.id;
        if (extractedId && extractedId !== '[object Object]' && !extractedId.includes('object Object')) {
          propertyObj.agentId = String(extractedId);
        } else {
          // If we can't extract a valid ID, set to null to prevent [object Object] in navigation
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Cannot extract valid agentId from object, setting to null:', propertyObj.propertyId || propertyObj._id);
          }
          propertyObj.agentId = null;
        }
      }
      
      // Final validation: ensure agentId is never [object Object]
      if (propertyObj.agentId && (propertyObj.agentId === '[object Object]' || String(propertyObj.agentId).includes('object Object'))) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ CRITICAL: agentId is [object Object], setting to null:', propertyObj.propertyId || propertyObj._id);
        }
        propertyObj.agentId = null;
      }
      
      return propertyObj;
      });
    } catch (processError) {
      console.error('❌ Property processing error:', processError);
      // Fallback to basic processing - ensure agentId is always a string
      processedProperties = properties.map(property => {
        if (!property) return property;
        try {
          const prop = property.toObject ? property.toObject() : property;
          // CRITICAL: Ensure agentId is a string even in fallback case
          if (prop.agentId && typeof prop.agentId === 'object' && prop.agentId !== null) {
            const agentObj = prop.agentId as any;
            const extractedId = agentObj._id?.toString?.() || agentObj.id?.toString?.() || agentObj._id || agentObj.id;
            if (extractedId && extractedId !== '[object Object]' && !String(extractedId).includes('object Object')) {
              prop.agentId = String(extractedId);
            } else {
              prop.agentId = null;
            }
          } else if (prop.agentId && (prop.agentId === '[object Object]' || String(prop.agentId).includes('object Object'))) {
            prop.agentId = null;
          }
          return prop;
        } catch (e) {
          console.error('❌ Individual property processing error:', e);
          return property;
        }
      });
    }
    
     // Add caching headers for better performance
     // For mobile, use shorter cache times to ensure fresh data
     const isMobileRequest = request.headers.get('x-mobile-optimized') === 'true';
     const cacheControl = isMobileRequest 
       ? 'public, s-maxage=10, stale-while-revalidate=60, max-age=10' // Shorter cache for mobile
       : 'public, s-maxage=30, stale-while-revalidate=600, max-age=30'; // Longer cache for desktop
     
     const response = NextResponse.json({ 
      success: true, 
      data: processedProperties || [],
       meta: {
         total: properties.length,
         isMobile: isMobileRequest
       }
     });
     
     // Set cache headers based on device type
     response.headers.set('Cache-Control', cacheControl);
     // Add CORS headers to ensure mobile can access
     response.headers.set('Access-Control-Allow-Credentials', 'true');
     response.headers.set('Access-Control-Allow-Origin', '*');
     
     if (process.env.NODE_ENV === 'development') {
       console.log('📱 Response headers:', { 
         isMobile: isMobileRequest, 
         cacheControl,
         propertyCount: processedProperties?.length || 0 
       });
     }
     
     return response;
  } catch (error) {
    // Log the actual error details for debugging
    console.error('❌ GET /api/properties - Error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
      fullError: error
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch properties',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Starting property creation...');
    }
    
    await connectDB();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Database connected');
    }
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No valid session found');
      }
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Session found:', { userId: session.userId, role: session.role });
    }
    
    // Check authorization for creating properties
    // For create operations with "own" permissions, allow if user is creating for themselves
    const authResult = isAllowed({
      sessionUserId: session.userId,
      role: session.role,
      action: 'create',
      resource: 'property',
      ownerId: session.userId // Set ownerId to session user for create operations
    });
    
    if (!authResult.allowed) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Authorization denied:', authResult.reason);
      }
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: insufficient permissions' 
      }, { status: 403 });
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User authorized to create properties');
    }
    
    // Get user profile for agent data (include agentProfile for superadmin)
    let user = await User.findById(session.userId).select('role fullName phone email profile avatar agentProfile')
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found with session ID, trying to find superadmin user...');
      }
      // Fallback: if session user ID doesn't exist, find the superadmin user
      user = await User.findOne({ role: 'superadmin' }).select('role fullName phone email profile avatar agentProfile')
      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ No superadmin user found either');
        }
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Found superadmin user as fallback:', { id: user._id, role: user.role, fullName: user.fullName });
      }
    }
    
    // Check if user has agent profile (superadmin should have enhanced agent profile)
    const hasAgentProfile = user.agentProfile && Object.keys(user.agentProfile).length > 0;
    if (!hasAgentProfile && (user.role === 'superadmin' || user.role === 'agent')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ User is superadmin/agent but missing agent profile');
        console.log('📝 Note: Superadmin should have enhanced agent profile for full functionality');
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User profile loaded:', { id: user._id, role: user.role, fullName: user.fullName });
    }
    
    // Parse request body
    const body = await request.json();
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 Request body:', body);
    }
    
    // Validate required fields based on listing type
    const baseRequiredFields = ['title', 'description', 'price', 'location', 'district'];
    const rentRequiredFields = ['bedrooms', 'bathrooms'];
    
    // For rent properties, require bedrooms and bathrooms
    // For sale properties, bedrooms and bathrooms are optional
    const requiredFields = body.listingType === 'rent' 
      ? [...baseRequiredFields, ...rentRequiredFields]
      : baseRequiredFields;
    
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Missing required fields:', missingFields);
        console.log('📦 Request body for debugging:', {
          title: body.title,
          description: body.description,
          price: body.price,
          location: body.location,
          district: body.district,
          bedrooms: body.bedrooms,
          bathrooms: body.bathrooms,
          listingType: body.listingType,
          allFields: Object.keys(body)
        });
      }
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Generate next property ID
    const nextPropertyId = await getNextPropertyId();
    if (process.env.NODE_ENV === 'development') {
      console.log('🆔 Generated property ID:', nextPropertyId);
    }
    
    // Company logo is now applied as a watermark overlay, not added to images array
    const companyLogoUrl = getCompanyLogoUrl();
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Company logo configuration check:');
      console.log('  ENABLE_COMPANY_LOGO:', process.env.ENABLE_COMPANY_LOGO);
      console.log('  COMPANY_LOGO_URL:', process.env.COMPANY_LOGO_URL);
      console.log('  getCompanyLogoUrl() result:', companyLogoUrl);
      console.log('ℹ️ Company logo will be applied as watermark overlay on frontend');
    }
    
    // Handle thumbnail and gallery images
    let thumbnailImage = body.thumbnailImage || '';
    let imagesArray: string[] = [];
    
    // Get gallery images from various possible fields
    // Priority: images > additionalImages > uploadedImages
    if (body.images && Array.isArray(body.images)) {
      imagesArray = Array.from(new Set(body.images)); // Remove duplicates
    } else if (body.additionalImages && Array.isArray(body.additionalImages)) {
      imagesArray = [...body.additionalImages];
    } else if (body.uploadedImages && Array.isArray(body.uploadedImages)) {
      imagesArray = [...body.uploadedImages];
    }
    
    // If we have a listing ID, verify the images belong to this listing
    if (nextPropertyId && imagesArray.length > 0) {
      imagesArray = imagesArray.filter(url => 
        url.includes(`/properties/${nextPropertyId}/`) || 
        url.includes(`/properties/temp/`) ||
        url.includes('r2.dev') // Allow R2 URLs
      );
    }
    
    // Handle thumbnail logic
    if (thumbnailImage && !imagesArray.includes(thumbnailImage)) {
      imagesArray.unshift(thumbnailImage); // Add thumbnail as first image
    } else if (!thumbnailImage && imagesArray.length > 0) {
      // If no thumbnail provided but we have gallery images, use first one as thumbnail
      thumbnailImage = imagesArray[0];
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📸 Image handling:', {
        thumbnailImage,
        galleryImages: imagesArray,
        hasThumbnail: !!thumbnailImage,
        hasGallery: imagesArray.length > 0,
        bodyImages: body.images,
        bodyAdditionalImages: body.additionalImages,
        bodyUploadedImages: body.uploadedImages,
        nextPropertyId
      });
    }
    
    // Prepare agent data for the property
    // Check both top-level avatar and profile.avatar
    const agentAvatar = user.avatar || user.profile?.avatar;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 User avatar debug:', {
        userId: user._id,
        topLevelAvatar: user.avatar,
        profileAvatar: user.profile?.avatar,
        finalAvatar: agentAvatar,
        hasAvatar: !!agentAvatar
      });
    }
    
    const agentData = {
      name: user.fullName || user.firstName + ' ' + user.lastName || 'Agent',
      phone: user.phone || 'N/A',
      image: agentAvatar || DEFAULT_AVATAR_URL,
      rating: 5.0 // Default rating for new agents
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Agent data for property:', agentData);
    }

    // Automatically append Somali language suffix based on listing type
    let enhancedTitle = body.title;
    const listingType = body.listingType || 'sale';
    
    if (listingType === 'rent') {
      enhancedTitle = `${body.title} Kiro ah`;
    } else if (listingType === 'sale') {
      enhancedTitle = `${body.title} iib ah`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🏷️ Title enhancement:', {
        originalTitle: body.title,
        listingType: listingType,
        enhancedTitle: enhancedTitle
      });
    }

    // Sanitize and prepare property data
    const allowedFields = [
      'title', 'location', 'district', 'price', 'bedrooms', 'beds', 'bathrooms', 'baths',
      'area', 'sqft', 'yearBuilt', 'lotSize', 'propertyType', 'listingType', 'documentType', 'measurement',
      'status', 'description', 'features', 'amenities', 'thumbnailImage', 'additionalImages'
    ];
    
    const sanitizedData = sanitizeUpdateData(body, allowedFields);
    
    // Create property data with enforced ownership
    const propertyData: any = enforceOwnership({
      propertyId: nextPropertyId,
      title: enhancedTitle,
      location: sanitizedData.location,
      district: sanitizedData.district,
      price: parseFloat(sanitizedData.price),
      beds: parseInt(sanitizedData.bedrooms || sanitizedData.beds || '0'),
      baths: parseInt(sanitizedData.bathrooms || sanitizedData.baths || '0'),
      sqft: sanitizedData.area ? parseInt(sanitizedData.area) : (sanitizedData.sqft ? parseInt(sanitizedData.sqft) : undefined),
      yearBuilt: parseInt(sanitizedData.yearBuilt) || 2020,
      lotSize: parseInt(sanitizedData.lotSize) || 1000,
      propertyType: sanitizedData.propertyType || 'villa',
      listingType: listingType,
      documentType: sanitizedData.documentType || null,
      measurement: sanitizedData.measurement || undefined,
      status: sanitizedData.status || (listingType === 'rent' ? 'For Rent' : 'For Sale'),
      description: sanitizedData.description,
      features: Array.isArray(sanitizedData.features) ? sanitizedData.features : [],
      amenities: Array.isArray(sanitizedData.amenities) ? sanitizedData.amenities : [],
      thumbnailImage: thumbnailImage, // Use the processed thumbnail image
      images: imagesArray,
      agent: agentData,
      deletionStatus: 'active'
    }, session.userId, 'agentId' as any);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🏗️ Creating property with data:', propertyData);
      console.log('📸 Final image data being saved:', {
        thumbnailImage: propertyData.thumbnailImage,
        images: propertyData.images,
        imagesLength: propertyData.images?.length,
        thumbnailImageType: typeof propertyData.thumbnailImage,
        imagesType: typeof propertyData.images
      });
      console.log('🔍 Status field debug:', {
        bodyStatus: body.status,
        bodyListingType: body.listingType,
        finalStatus: propertyData.status,
        statusType: typeof propertyData.status
      });
    }
    
    // Additional validation before saving
    if (propertyData.yearBuilt < 1800) {
      return NextResponse.json(
        { success: false, error: 'Year built must be 1800 or later' },
        { status: 400 }
      );
    }
    
    if (propertyData.price < 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be positive' },
        { status: 400 }
      );
    }
    
    if (propertyData.beds < 0 || propertyData.baths < 0 || (propertyData.sqft && propertyData.sqft < 0)) {
      return NextResponse.json(
        { success: false, error: 'Bedrooms and bathrooms must be positive' },
        { status: 400 }
      );
    }
    
    // Debug: Log the property data being saved
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Property data being saved:', {
        thumbnailImage: propertyData.thumbnailImage,
        thumbnailImageType: typeof propertyData.thumbnailImage,
        thumbnailImageLength: propertyData.thumbnailImage?.length,
        hasThumbnailImage: !!propertyData.thumbnailImage,
        thumbnailImageEmpty: propertyData.thumbnailImage === '',
        thumbnailImageNull: propertyData.thumbnailImage === null,
        thumbnailImageUndefined: propertyData.thumbnailImage === undefined
      });
    }
    
    // Create and save property
    const property = new Property(propertyData);
    await property.save();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Property created successfully:', property._id);
      console.log('📋 Saved property details:', {
        id: property._id,
        propertyId: property.propertyId,
        title: property.title,
        deletionStatus: property.deletionStatus,
        agentId: property.agentId,
        createdAt: property.createdAt
      });
    }
    
    // Verify the property was saved correctly by fetching it
    if (process.env.NODE_ENV === 'development') {
      const savedProperty = await Property.findById(property._id);
      console.log('🔍 Verification - Property exists in database:', !!savedProperty);
      if (savedProperty) {
        console.log('🔍 Verification - Property deletionStatus:', savedProperty.deletionStatus);
        console.log('🔍 Verification - Property is queryable:', savedProperty.deletionStatus !== 'deleted');
        console.log('📸 Verification - Saved property images:', {
          thumbnailImage: savedProperty.thumbnailImage,
          images: savedProperty.images,
          imagesLength: savedProperty.images?.length,
          thumbnailImageType: typeof savedProperty.thumbnailImage,
          imagesType: typeof savedProperty.images
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: property 
    }, { status: 201 });
    
  } catch (error) {
    console.error('💥 Error creating property:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    );
  }
}
