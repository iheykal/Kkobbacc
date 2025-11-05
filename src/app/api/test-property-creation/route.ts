import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    console.log('🧪 Testing property creation and retrieval...');
    
    // Get all properties
    const allProperties = await Property.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`📋 Found ${allProperties.length} total properties in database`);
    
    // Get properties by agentId if specified
    let agentProperties = [];
    if (agentId) {
      agentProperties = await Property.find({ agentId }).sort({ createdAt: -1 });
      console.log(`👤 Found ${agentProperties.length} properties for agent ${agentId}`);
    }
    
    // Get properties with deletionStatus filter
    const activeProperties = await Property.find({ deletionStatus: { $ne: 'deleted' } }).sort({ createdAt: -1 }).limit(5);
    console.log(`✅ Found ${activeProperties.length} active properties`);
    
    // Get properties with agentId filter and deletionStatus filter
    let agentActiveProperties = [];
    if (agentId) {
      agentActiveProperties = await Property.find({ 
        agentId, 
        deletionStatus: { $ne: 'deleted' } 
      }).sort({ createdAt: -1 });
      console.log(`👤✅ Found ${agentActiveProperties.length} active properties for agent ${agentId}`);
    }
    
    // Check the most recent property
    const mostRecentProperty = allProperties[0];
    let mostRecentDetails = null;
    if (mostRecentProperty) {
      mostRecentDetails = {
        id: mostRecentProperty._id,
        propertyId: mostRecentProperty.propertyId,
        title: mostRecentProperty.title,
        agentId: mostRecentProperty.agentId,
        deletionStatus: mostRecentProperty.deletionStatus,
        createdAt: mostRecentProperty.createdAt,
        agent: mostRecentProperty.agent
      };
    }
    
    return NextResponse.json({
      success: true,
      data: {
        totalProperties: allProperties.length,
        agentProperties: agentProperties.length,
        activeProperties: activeProperties.length,
        agentActiveProperties: agentActiveProperties.length,
        mostRecentProperty: mostRecentDetails,
        sampleProperties: allProperties.slice(0, 3).map(p => ({
          id: p._id,
          propertyId: p.propertyId,
          title: p.title,
          agentId: p.agentId,
          deletionStatus: p.deletionStatus,
          createdAt: p.createdAt
        }))
      }
    });
    
  } catch (error) {
    console.error('Error in test property creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
