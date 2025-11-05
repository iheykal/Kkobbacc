import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging property agent data...');
    
    // Connect to database
    await connectDB();
    
    // Get a few properties to check agent data
    const properties = await Property.find({})
      .populate('agentId', '_id fullName phone email avatar profile.avatar')
      .limit(5)
      .select('_id title agentId agent');
    
    console.log('📊 Found properties:', properties.length);
    
    const debugData = properties.map(property => {
      const propertyObj = property.toObject ? property.toObject() : property;
      
      // Check agentId field
      let agentIdData = null;
      if (propertyObj.agentId) {
        if (typeof propertyObj.agentId === 'object' && propertyObj.agentId !== null) {
          const agentIdObj = propertyObj.agentId as {
            _id?: any;
            fullName?: string;
            phone?: string;
            email?: string;
            avatar?: string;
            profile?: { avatar?: string };
          };
          
          agentIdData = {
            type: 'object',
            _id: agentIdObj._id,
            fullName: agentIdObj.fullName,
            phone: agentIdObj.phone,
            email: agentIdObj.email,
            avatar: agentIdObj.avatar || agentIdObj.profile?.avatar
          };
        } else {
          agentIdData = {
            type: typeof propertyObj.agentId,
            value: propertyObj.agentId
          };
        }
      }
      
      // Check agent field
      let agentData = null;
      if (propertyObj.agent) {
        agentData = {
          type: 'object',
          name: propertyObj.agent.name,
          phone: propertyObj.agent.phone,
          image: propertyObj.agent.image,
          rating: propertyObj.agent.rating
        };
      }
      
      return {
        propertyId: propertyObj._id,
        title: propertyObj.title,
        agentId: agentIdData,
        agent: agentData,
        hasAgentId: !!propertyObj.agentId,
        hasAgent: !!propertyObj.agent,
        agentIdType: typeof propertyObj.agentId,
        agentType: typeof propertyObj.agent
      };
    });
    
    // Also check if there are any users with agent profiles
    const usersWithAgentProfiles = await User.find({
      agentProfile: { $exists: true, $ne: null }
    }).select('_id fullName phone role agentProfile');
    
    console.log('👤 Users with agent profiles:', usersWithAgentProfiles.length);
    
    return NextResponse.json({
      success: true,
      properties: debugData,
      usersWithAgentProfiles: usersWithAgentProfiles.map(user => ({
        id: user._id.toString(),
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        hasAgentProfile: !!user.agentProfile,
        agentProfileKeys: user.agentProfile ? Object.keys(user.agentProfile) : []
      })),
      analysis: {
        totalProperties: properties.length,
        propertiesWithAgentId: properties.filter(p => p.agentId).length,
        propertiesWithAgent: properties.filter(p => p.agent).length,
        usersWithAgentProfiles: usersWithAgentProfiles.length
      }
    });
    
  } catch (error) {
    console.error('❌ Debug property agent data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
