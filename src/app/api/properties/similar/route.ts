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

    // Build query to find similar properties in current district AND neighbors
    let query: any = {
      district: { $in: allRelevantDistricts },
      deletionStatus: { $ne: 'deleted' },
      isExpired: { $ne: true } // Exclude expired properties
    };

    // Exclude the current property if excludeId is provided
    if (excludeId) {
      // Try to parse as number first, if it fails, treat as string
      const excludeIdNum = parseInt(excludeId);
      if (!isNaN(excludeIdNum)) {
        query.$and = [
          { _id: { $ne: excludeId } },
          { propertyId: { $ne: excludeIdNum } }
        ];
      } else {
        query._id = { $ne: excludeId };
      }
    }

    // Find similar properties in current district and neighbors
    // Optimized query with field selection for better performance
    const similarProperties = await Property.find(query)
      .select('propertyId title location district price beds baths sqft propertyType listingType status thumbnailImage images agentId createdAt viewCount uniqueViewCount featured district measurement')
      .populate('agentId', 'fullName phone profile.avatar agentProfile.rating')
      .lean()
      .limit(limit * 2); // Fetch more than needed for sorting, but limit DB query
    
    // Single-pass optimization: separate properties by district
    const sameDistrictProps: any[] = [];
    const neighborProps: any[] = [];
    
    for (const p of similarProperties) {
      if (p.district === district) {
        sameDistrictProps.push(p);
      } else {
        neighborProps.push(p);
      }
    }
    
    // Optimized sorting: pre-compute sort scores
    const sortProps = (props: any[]) => {
      // Pre-compute timestamps and sort scores once
      for (const p of props) {
        p._sortScore = (p.featured ? 1000000 : 0) + (p.viewCount || 0) * 100 + (new Date(p.createdAt).getTime() || 0) / 1000000;
      }
      return props.sort((a, b) => (b._sortScore || 0) - (a._sortScore || 0));
    };
    
    const sortedSameDistrict = sortProps(sameDistrictProps);
    const sortedNeighbors = sortProps(neighborProps);
    
    // Mix results: prioritize same district but ensure neighbors are included
    // Take up to 4 from same district, then fill with neighbors
    const sameDistrictCount = Math.min(sortedSameDistrict.length, Math.floor(limit * 0.7)); // 70% from same district
    const neighborCount = limit - sameDistrictCount;
    
    const finalProperties = [
      ...sortedSameDistrict.slice(0, sameDistrictCount),
      ...sortedNeighbors.slice(0, neighborCount)
    ];
    
    // Reduced logging for better performance

    // Process properties to ensure consistent agent data
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
    
    // Set aggressive cache headers - recommendations can be cached longer
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=1200, max-age=60');
    
    return response;

  } catch (error) {
    // Reduced error logging for better performance
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
