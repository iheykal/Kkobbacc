import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing restore functionality...');
    await connectDB();

    // Check if user is SuperAdmin
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    const authResult = await authResponse.json();
    console.log('🧪 Auth check result:', authResult);

    if (!authResponse.ok || (!authResult.user && !authResult.data)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user || authResult.data;
    console.log('🧪 Current user:', currentUser);

    if (currentUser.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get all agents
    const agents = await User.find({ role: { $in: ['agent', 'agency'] } }).select('_id fullName phone profile').lean();
    console.log(`🧪 Found ${agents.length} agents`);

    return NextResponse.json({
      success: true,
      message: 'Restore test successful',
      data: {
        authenticated: true,
        userRole: currentUser.role,
        totalAgents: agents.length,
        agents: agents.map(agent => ({
          id: agent._id,
          name: agent.fullName,
          hasAvatar: !!agent.profile?.avatar,
          avatarUrl: agent.profile?.avatar
        }))
      }
    });

  } catch (error) {
    console.error('❌ Test restore error:', error);
    return NextResponse.json(
      { success: false, error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
