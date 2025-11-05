import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';
import { agentCache } from '@/lib/agentCache';

export const dynamic = 'force-dynamic';

/**
 * Super minimal agent API - absolute minimum data for maximum speed
 * Now supports both slug-based and ID-based URLs
 * Now fetches agent directly from User model if no properties found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  try {
    const slugOrId = params.id;
    console.log('⚡ Super minimal agent API for slug/ID:', slugOrId);
    
    await connectDB();
    
    // Try to resolve agent ID from slug or ID
    let agentId: string | null = null;
    
    // First try to find by slug
    const agentBySlug = await User.findOne({
      'profile.slug': slugOrId,
      role: { $in: ['agent', 'agency'] }
    }).select('_id').lean();
    
    if (agentBySlug && !Array.isArray(agentBySlug) && agentBySlug._id) {
      agentId = agentBySlug._id.toString();
      console.log('✅ Found agent by slug:', slugOrId, '-> ID:', agentId);
    } else if (/^[0-9a-fA-F]{24}$/.test(slugOrId)) {
      // If not found by slug, try as ObjectId (for backward compatibility)
      const agentById = await User.findById(slugOrId).select('_id').lean();
      if (agentById && !Array.isArray(agentById) && agentById._id) {
        agentId = agentById._id.toString();
        console.log('✅ Found agent by ID:', agentId);
      }
    }
    
    if (!agentId) {
      console.error('❌ Agent not found for slug/ID:', slugOrId);
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    // Check cache first
    const cachedData = agentCache.get(agentId);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`⚡ Cache hit in ${responseTime}ms`);
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        responseTime: responseTime
      });
    }
    
    await connectDB();
    
    // Try to fetch agent directly from User model first
    let agentData: any = null;
    try {
      const user = await User.findById(agentId)
        .select('_id fullName firstName lastName phone email avatar profile.avatar role status')
        .lean();
      
      if (user && !Array.isArray(user) && user._id) {
        console.log('✅ Found agent in User model');
        // Build name from available fields - prioritize fullName
        let agentName = user.fullName;
        if (!agentName || agentName.trim() === '') {
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          agentName = `${firstName} ${lastName}`.trim();
        }
        // Only use 'Agent' as fallback if we truly have no name
        if (!agentName || agentName.trim() === '') {
          agentName = 'Agent';
        }
        
        agentData = {
          id: user._id.toString(),
          name: agentName,
          phone: user.phone || 'N/A',
          email: user.email || '',
          image: user.avatar || user.profile?.avatar || '/icons/profile.gif',
          propertiesCount: 0,
          properties: []
        };
        console.log('✅ Agent name set to:', agentName);
      }
    } catch (userError) {
      console.log('⚠️ Could not fetch agent from User model, trying properties...');
    }
    
    // Ultra-minimal query - only 1 property, absolute minimum fields
    const properties = await Property.find({
      agentId: agentId,
      deletionStatus: { $ne: 'deleted' }
    })
    .select('_id propertyId title location price beds baths propertyType status thumbnailImage agent.name agent.phone agent.image')
    .sort({ createdAt: -1 })
    .lean()
    .limit(1); // Only 1 property for maximum speed
    
    // CRITICAL: Always ensure agentData exists and has correct name from User model
    // If agentData wasn't set from User model lookup, or name is "Agent", fetch it now
    if (!agentData || !agentData.name || agentData.name === 'Agent' || agentData.name.trim() === '') {
      try {
        const user = await User.findById(agentId)
          .select('fullName firstName lastName phone email avatar profile.avatar')
          .lean();
        if (user && !Array.isArray(user) && user._id) {
          // Build name from available fields - prioritize fullName
          let agentName = user.fullName;
          if (!agentName || agentName.trim() === '') {
            const firstName = user.firstName || '';
            const lastName = user.lastName || '';
            agentName = `${firstName} ${lastName}`.trim();
          }
          // Only use 'Agent' as fallback if we truly have no name
          if (!agentName || agentName.trim() === '') {
            agentName = 'Agent';
          }
          
          // Set or update agentData with User model data
          if (!agentData) {
            agentData = {
              id: agentId,
              name: agentName,
              phone: user.phone || 'N/A',
              email: '',
              image: user.avatar || user.profile?.avatar || '/icons/profile.gif',
              propertiesCount: 0,
              properties: []
            };
          } else {
            // Update existing agentData with correct name
            agentData.name = agentName;
            if (!agentData.phone || agentData.phone === 'N/A') {
              agentData.phone = user.phone || 'N/A';
            }
            if (!agentData.image || agentData.image === '/icons/profile.gif') {
              agentData.image = user.avatar || user.profile?.avatar || '/icons/profile.gif';
            }
          }
          console.log('✅ Agent name fetched from User model:', agentName);
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch user name from User model:', e);
      }
    }
    
    // If we have properties, add them to agentData
    if (properties.length > 0) {
      const agent = properties[0].agent;
      
      // Update agentData with properties (but keep name from User model)
      agentData = {
        id: agentId,
        name: agentData.name, // Always use name from User model
        phone: agent?.phone || agentData?.phone || 'N/A',
        email: agentData?.email || '',
        image: agent?.image || agentData?.image || '/icons/profile.gif',
        propertiesCount: 1,
        properties: [{
          id: (properties[0] as any)._id.toString(),
          _id: (properties[0] as any)._id.toString(),
          propertyId: (properties[0] as any).propertyId,
          title: properties[0].title,
          location: properties[0].location,
          price: properties[0].price,
          beds: properties[0].beds,
          baths: properties[0].baths,
          propertyType: properties[0].propertyType,
          status: properties[0].status,
          thumbnailImage: properties[0].thumbnailImage
        }]
      };
      
      console.log('✅ Final agent data name:', agentData.name);
    } else if (!agentData) {
      // No properties and no user found
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    } else {
      // We have agent data from User model but no properties
      agentData.propertiesCount = 0;
      agentData.properties = [];
    }
    
    // Cache for 15 minutes
    agentCache.set(agentId, agentData, 15 * 60 * 1000);
    
    const responseTime = Date.now() - startTime;
    console.log(`⚡ Super minimal response in ${responseTime}ms`);
    return NextResponse.json({
      success: true,
      data: agentData,
      cached: false,
      responseTime: responseTime
    });
    
  } catch (error) {
    console.error('Error in super minimal agent API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
