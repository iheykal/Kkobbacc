import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🔍 Fetching all agents...');
    
    // Get all active agents
    const agents = await User.find({
      role: { $in: ['agent', 'agency'] },
      status: 'active'
    }).select('_id fullName firstName lastName phone email avatar profile.avatar role status');
    
    console.log('🔍 Found agents:', agents.length);
    
    const agentsData = agents.map(agent => ({
      id: agent._id.toString(),
      name: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || 'Agent',
      phone: agent.phone || 'N/A',
      image: agent.avatar || agent.profile?.avatar || '/icons/profile.gif',
      role: agent.role,
      status: agent.status
    }));
    
    console.log('✅ Returning agents data:', agentsData);
    
    return NextResponse.json({
      success: true,
      data: agentsData
    });
    
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
