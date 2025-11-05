import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing local image accessibility...');
    await connectDB();

    // Check if user is SuperAdmin
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    const authResult = await authResponse.json();
    if (!authResponse.ok || (!authResult.user && !authResult.data)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user || authResult.data;
    if (currentUser.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get all agents
    const agents = await User.find({ role: { $in: ['agent', 'agency'] } }).select('_id fullName phone profile').lean();
    console.log(`📋 Found ${agents.length} agents to test`);

    const results = [];

    for (const agent of agents) {
      try {
        console.log(`🧪 Testing agent: ${agent.fullName}`);
        
        if (!agent.profile?.avatar) {
          results.push({
            agentId: agent._id,
            agentName: agent.fullName,
            status: 'no_avatar',
            error: 'No avatar URL found'
          });
          continue;
        }

        // Convert relative URLs to absolute URLs
        let imageUrl = agent.profile.avatar;
        if (imageUrl.startsWith('/')) {
          imageUrl = `${request.nextUrl.origin}${imageUrl}`;
        }

        console.log(`🔍 Testing URL: ${imageUrl}`);
        
        // Test if the image is accessible
        const imageResponse = await fetch(imageUrl);
        console.log(`📡 Response status: ${imageResponse.status}`);
        
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          results.push({
            agentId: agent._id,
            agentName: agent.fullName,
            status: 'accessible',
            imageUrl: agent.profile.avatar,
            absoluteUrl: imageUrl,
            responseStatus: imageResponse.status,
            imageSize: imageBuffer.byteLength
          });
        } else {
          results.push({
            agentId: agent._id,
            agentName: agent.fullName,
            status: 'not_accessible',
            imageUrl: agent.profile.avatar,
            absoluteUrl: imageUrl,
            responseStatus: imageResponse.status,
            error: `HTTP ${imageResponse.status}: ${imageResponse.statusText}`
          });
        }

      } catch (error) {
        console.error(`❌ Error testing agent ${agent.fullName}:`, error);
        results.push({
          agentId: agent._id,
          agentName: agent.fullName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Local image test completed',
      data: {
        totalAgents: agents.length,
        results
      }
    });

  } catch (error) {
    console.error('❌ Error testing local images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test local images' },
      { status: 500 }
    );
  }
}
