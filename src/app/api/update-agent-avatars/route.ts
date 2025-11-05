import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateAgentAvatar } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🔄 Starting agent avatar update...');
    
    // Find all agents without avatars (check both top-level avatar and profile.avatar)
    const agentsWithoutAvatars = await User.find({ 
      role: { $in: ['agent', 'agency'] },
      $or: [
        { avatar: { $exists: false } },
        { avatar: null },
        { avatar: '' },
        { avatar: '/icons/uze.png' }, // The default avatar that all agents are using
        { 'profile.avatar': { $exists: false } },
        { 'profile.avatar': null },
        { 'profile.avatar': '' },
        { 'profile.avatar': '/icons/uze.png' }
      ]
    }).select('_id firstName lastName fullName email phone role avatar profile.avatar');
    
    console.log(`📋 Found ${agentsWithoutAvatars.length} agents without proper avatars`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Update each agent with a unique avatar
    for (const agent of agentsWithoutAvatars) {
      try {
        // Generate unique avatar based on agent ID and name
        const uniqueAvatar = generateAgentAvatar(agent._id.toString(), undefined, agent.fullName);
        
        // Update the agent's avatar in both locations for consistency
        await User.findByIdAndUpdate(agent._id, {
          avatar: uniqueAvatar,
          'profile.avatar': uniqueAvatar
        });
        
        updatedCount++;
        
        console.log(`✅ Updated agent ${agent.fullName || agent.firstName} with avatar:`, uniqueAvatar);
      } catch (error) {
        console.error(`❌ Error updating agent ${agent._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`🎯 Agent avatar update completed: ${updatedCount} updated, ${errorCount} errors`);
    
    // Get updated agent list
    const updatedAgents = await User.find({ 
      role: { $in: ['agent', 'agency'] } 
    }).select('_id firstName lastName fullName avatar role');
    
    return NextResponse.json({
      success: true,
      message: `Agent avatar update completed`,
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
    console.error('❌ Error in agent avatar update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
