import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

// Force dynamic rendering since this route uses nextUrl.searchParams
export const dynamic = 'force-dynamic';

// District neighbors mapping based on Mogadishu map
// Format: Database district name → [neighboring districts in database format]
const DISTRICT_NEIGHBORS: Record<string, string[]> = {
  'Abdiaziz': ['Shibis', 'Karan', 'Hamar‑Jajab'],
  'Bondhere': ['Shibis', 'Wardhiigleey', 'Howl-Wadag', 'Hamar‑Weyne'],
  'Daynile': ['Yaqshid', 'Wardhiigleey', 'Hodan', 'Kaxda', 'Dharkenley'],
  'Dharkenley': ['Daynile', 'Kaxda', 'Wadajir'],
  'Hamar‑Jajab': ['Waberi', 'Hamar‑Weyne', 'Abdiaziz'],
  'Hamar‑Weyne': ['Hamar‑Jajab', 'Bondhere', 'Shibis', 'Shangani'],
  'Howl-Wadag': ['Hodan', 'Wardhiigleey', 'Bondhere', 'Waberi'],
  'Heliwaa': ['Karan', 'Yaqshid'],
  'Hodan': ['Wadajir', 'Dharkenley', 'Daynile', 'Howl-Wadag', 'Wardhiigleey', 'Garasbaley'],
  'Kaxda': ['Dharkenley', 'Daynile', 'Garasbaley'],
  'Karan': ['Heliwaa', 'Yaqshid', 'Abdiaziz'],
  'Shangani': ['Hamar‑Weyne', 'Shibis'],
  'Shibis': ['Abdiaziz', 'Karan', 'Hamar‑Weyne', 'Bondhere', 'Shangani'],
  'Waberi': ['Wadajir', 'Howl-Wadag', 'Hamar‑Jajab'],
  'Wadajir': ['Hodan', 'Dharkenley', 'Waberi'],
  'Wardhiigleey': ['Bondhere', 'Howl-Wadag', 'Hodan', 'Daynile', 'Yaqshid'],
  'Yaqshid': ['Heliwaa', 'Karan', 'Wardhiigleey', 'Daynile'],
  'Darusalam': ['Yaqshid'], // Based on map, Darusalam borders Yaqshid area
  'Garasbaley': ['Kaxda', 'Hodan', 'Daynile']
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const district = searchParams.get('district');
    const excludeId = searchParams.get('excludeId');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!district) {
      return NextResponse.json(
        { error: 'District parameter is required' },
        { status: 400 }
      );
    }

    // Get neighboring districts
    const neighbors = DISTRICT_NEIGHBORS[district] || [];
    const allRelevantDistricts = [district, ...neighbors];

    // Base query conditions
    const baseQuery: any = {
      deletionStatus: { $ne: 'deleted' },
      isExpired: { $ne: true }
    };

    // Exclude the current property
    if (excludeId) {
      const excludeIdNum = parseInt(excludeId);
      if (!isNaN(excludeIdNum)) {
        baseQuery.$and = [
          { _id: { $ne: excludeId } },
          { propertyId: { $ne: excludeIdNum } }
        ];
      } else {
        baseQuery._id = { $ne: excludeId };
      }
    }

    // Tier 1 & 2 Query: Current District + Neighbors
    // We fetch a bit more than limit to ensure we have enough "Same District" candidates if they exist
    const primaryQuery = {
      ...baseQuery,
      district: { $in: allRelevantDistricts }
    };

    const primaryResults = await Property.find(primaryQuery)
      .select('propertyId title location district price beds baths sqft propertyType listingType status thumbnailImage images agentId createdAt viewCount uniqueViewCount featured district measurement')
      .populate('agentId', 'fullName phone profile.avatar agentProfile.rating')
      .lean()
      .limit(limit * 3); // Fetch extra to allow for in-memory sorting/splitting

    // Split and Sort Primary Results
    // strictly sort by createdAt (newest first)
    const sortByDate = (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    const sameDistrictProps = primaryResults
      .filter((p: any) => p.district === district)
      .sort(sortByDate);

    const neighborProps = primaryResults
      .filter((p: any) => p.district !== district)
      .sort(sortByDate);

    // Build the list
    let finalProperties = [...sameDistrictProps];

    // If we haven't hit the limit, add neighbors
    if (finalProperties.length < limit) {
      const needed = limit - finalProperties.length;
      finalProperties = [...finalProperties, ...neighborProps.slice(0, needed)];
    } else {
      // We have enough same-district properties, just slice to limit
      finalProperties = finalProperties.slice(0, limit);
    }

    // Tier 3 Query: If we STILL don't have enough, fetch "Everything Else"
    if (finalProperties.length < limit) {
      const needed = limit - finalProperties.length;

      // We need to exclude all the IDs we've already found to avoid duplicates
      const existingIds = finalProperties.map(p => p._id);

      const fallbackQuery = {
        ...baseQuery,
        _id: { $nin: [...existingIds, ...(excludeId ? [excludeId] : [])] }, // Exclude found + original
        district: { $nin: allRelevantDistricts } // Optimization: Don't re-search districts we just searched
      };

      const fallbackResults = await Property.find(fallbackQuery)
        .select('propertyId title location district price beds baths sqft propertyType listingType status thumbnailImage images agentId createdAt viewCount uniqueViewCount featured district measurement')
        .populate('agentId', 'fullName phone profile.avatar agentProfile.rating')
        .sort({ createdAt: -1 }) // Database sort by date
        .limit(needed)
        .lean();

      finalProperties = [...finalProperties, ...fallbackResults];
    }

    // Process properties to ensure consistent agent data (keeping original helper logic)
    const processedProperties = finalProperties.map(property => {
      const propertyObj = property;

      // Store the original agentId as a string for navigation
      let originalAgentId = null;
      if (propertyObj.agentId) {
        if (typeof propertyObj.agentId === 'string') {
          originalAgentId = propertyObj.agentId;
        } else if (typeof propertyObj.agentId === 'object' && propertyObj.agentId && '_id' in propertyObj.agentId) {
          originalAgentId = (propertyObj.agentId as any)._id.toString();
        }
      }

      // Use populated agentId data for fresh agent information
      if (propertyObj.agentId && typeof propertyObj.agentId === 'object') {
        const agentData = propertyObj.agentId as any;
        const agentAvatar = agentData.profile?.avatar;
        const agentRating = agentData.agentProfile?.rating || 0;

        return {
          ...propertyObj,
          agentId: originalAgentId,
          agent: {
            name: agentData.fullName || 'Unknown Agent',
            phone: agentData.phone || 'N/A',
            image: agentAvatar || '/icons/profile.gif',
            rating: agentRating
          }
        };
      }

      return {
        ...propertyObj,
        agentId: originalAgentId,
        agent: propertyObj.agent || {
          name: 'Unknown Agent',
          phone: 'N/A',
          image: '/icons/profile.gif',
          rating: 0
        }
      };
    });

    // Add caching headers for better performance
    const response = NextResponse.json({
      success: true,
      properties: processedProperties,
      count: processedProperties.length
    });

    // Set aggressive cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=1200, max-age=60');

    return response;

  } catch (error) {
    console.error('❌ GET /api/properties/similar - Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        error: 'Failed to fetch similar properties',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
