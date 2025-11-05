import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Searching for agent by name:', name);
    
    // Search for agents by name (case-insensitive)
    const agents = await User.find({
      $or: [
        { fullName: { $regex: name, $options: 'i' } },
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } }
      ],
      role: { $in: ['agent', 'agency'] },
      status: 'active'
    }).select('_id fullName firstName lastName phone email avatar profile.avatar');
    
    console.log('🔍 Found agents:', agents.length);
    
    if (agents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No agent found with that name' },
        { status: 404 }
      );
    }
    
    // Return the first matching agent
    const agent = agents[0];
    const agentData = {
      id: agent._id.toString(),
      name: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || 'Agent',
      phone: agent.phone || 'N/A',
      image: agent.avatar || agent.profile?.avatar || '/icons/profile.gif'
    };
    
    console.log('✅ Returning agent data:', agentData);
    
    return NextResponse.json({
      success: true,
      data: agentData
    });
    
  } catch (error) {
    console.error('Error searching for agent by name:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search for agent' },
      { status: 500 }
    );
  }
}
