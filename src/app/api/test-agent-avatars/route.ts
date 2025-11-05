import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🧪 Testing agent avatars...');
    
    // Get all agents
    const agents = await User.find({ 
      role: { $in: ['agent', 'agency'] } 
    }).select('_id firstName lastName fullName email phone avatar profile.avatar role agentProfile');
    
    console.log(`👤 Found ${agents.length} agents`);
    
    // Get properties with agent data
    const properties = await Property.find({ 
      deletionStatus: { $ne: 'deleted' } 
    })
    .populate('agentId', 'firstName lastName fullName avatar')
    .select('propertyId title agentId agent')
    .limit(10);
    
    console.log(`🏠 Found ${properties.length} properties to check`);
    
    // Check agent avatar status
    const agentAvatarStatus = agents.map(agent => {
      // Check both top-level avatar and profile.avatar
      const agentAvatar = agent.avatar || agent.profile?.avatar;
      const hasAvatar = !!(agent.avatar || agent.profile?.avatar);
      
      return {
        id: agent._id,
        name: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim(),
        phone: agent.phone,
        topLevelAvatar: agent.avatar,
        profileAvatar: agent.profile?.avatar,
        finalAvatar: agentAvatar,
        hasAvatar: hasAvatar,
        avatarType: agentAvatar ? (agentAvatar.startsWith('http') ? 'external' : 'local') : 'none',
        role: agent.role
      };
    });
    
    // Check property agent data
    const propertyAgentData = properties.map(property => {
      const propertyObj = property.toObject();
      return {
        propertyId: propertyObj.propertyId,
        title: propertyObj.title,
        agentId: propertyObj.agentId && typeof propertyObj.agentId === 'object' ? (propertyObj.agentId as any)._id : propertyObj.agentId,
        populatedAgent: propertyObj.agentId && typeof propertyObj.agentId === 'object' ? {
          name: (propertyObj.agentId as any).fullName || `${(propertyObj.agentId as any).firstName || ''} ${(propertyObj.agentId as any).lastName || ''}`.trim(),
          avatar: (propertyObj.agentId as any).avatar,
          hasAvatar: !!(propertyObj.agentId as any).avatar
        } : null,
        embeddedAgent: propertyObj.agent ? {
          name: propertyObj.agent.name,
          avatar: propertyObj.agent.image,
          hasAvatar: !!propertyObj.agent.image
        } : null
      };
    });
    
    // Count avatar statistics
    const avatarStats = {
      totalAgents: agents.length,
      agentsWithAvatars: agents.filter(a => !!(a.avatar || a.profile?.avatar)).length,
      agentsWithoutAvatars: agents.filter(a => !(a.avatar || a.profile?.avatar)).length,
      avatarTypes: {
        external: agents.filter(a => (a.avatar || a.profile?.avatar) && (a.avatar || a.profile?.avatar).startsWith('http')).length,
        local: agents.filter(a => (a.avatar || a.profile?.avatar) && !(a.avatar || a.profile?.avatar).startsWith('http')).length,
        none: agents.filter(a => !(a.avatar || a.profile?.avatar)).length
      }
    };
    
    console.log('📊 Agent avatar statistics:', avatarStats);
    
    return NextResponse.json({
      success: true,
      data: {
        avatarStats,
        agentAvatarStatus,
        propertyAgentData,
        sampleAgents: agents.slice(0, 5).map(a => ({
          id: a._id,
          name: a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim(),
          topLevelAvatar: a.avatar,
          profileAvatar: a.profile?.avatar,
          finalAvatar: a.avatar || a.profile?.avatar,
          hasAvatar: !!(a.avatar || a.profile?.avatar)
        }))
      }
    });
    
  } catch (error) {
    console.error('Error in test agent avatars:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
