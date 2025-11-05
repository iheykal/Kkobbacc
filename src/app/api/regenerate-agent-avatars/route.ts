import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateAgentAvatar } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🔄 Starting agent avatar regeneration...');
    
    // Get all agents
    const allAgents = await User.find({ 
      role: { $in: ['agent', 'agency'] } 
    }).select('_id firstName lastName fullName email phone role avatar profile.avatar');
    
    console.log(`📋 Found ${allAgents.length} agents to regenerate avatars for`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Regenerate avatar for each agent
    for (const agent of allAgents) {
      try {
        // Generate new unique avatar with improved parameters
        const newAvatar = generateAgentAvatar(agent._id.toString(), undefined, agent.fullName);
        
        // Update the agent's avatar in both locations for consistency
        await User.findByIdAndUpdate(agent._id, {
          avatar: newAvatar,
          'profile.avatar': newAvatar
        });
        
        updatedCount++;
        
        console.log(`✅ Regenerated avatar for agent ${agent.fullName || agent.firstName}:`, newAvatar);
      } catch (error) {
        console.error(`❌ Error regenerating avatar for agent ${agent._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`🎯 Agent avatar regeneration completed: ${updatedCount} updated, ${errorCount} errors`);
    
    // Get updated agent list
    const updatedAgents = await User.find({ 
      role: { $in: ['agent', 'agency'] } 
    }).select('_id firstName lastName fullName avatar role');
    
    return NextResponse.json({
      success: true,
      message: `Agent avatar regeneration completed`,
      data: {
        totalAgents: updatedAgents.length,
        updatedCount,
        errorCount,
        agents: updatedAgents.map(agent => ({
          id: agent._id,
          name: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim(),
          avatar: agent.avatar,
          role: agent.role
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error in agent avatar regeneration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
