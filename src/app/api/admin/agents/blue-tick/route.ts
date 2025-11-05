import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Ultimate superadmin protection constants
const ULTIMATE_SUPERADMIN_PHONE = '0610251014';
const ULTIMATE_SUPERADMIN_NAME = 'Kobac Real Estate';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Session auth
    const cookie = req.cookies.get('kobac_session')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session: { userId: string; role: string } | null = null;
    try {
      session = JSON.parse(decodeURIComponent(cookie));
    } catch (_) {}

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ultimate superadmin
    const adminUser = await User.findById(session.userId);
    if (!adminUser || 
        adminUser.phone !== ULTIMATE_SUPERADMIN_PHONE || 
        adminUser.fullName !== ULTIMATE_SUPERADMIN_NAME) {
      return NextResponse.json({ 
        error: 'Only the ultimate superadmin can manage blue tick verification',
        code: 'ULTIMATE_SUPERADMIN_REQUIRED'
      }, { status: 403 });
    }

    const { agentId, action, reason } = await req.json();

    if (!agentId || !action || !['grant', 'suspend', 'reinstate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const agent = await User.findById(agentId);
    if (!agent || !['agent', 'agency'].includes(agent.role)) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Initialize agentProfile if it doesn't exist
    if (!agent.agentProfile) {
      agent.agentProfile = {
        verified: false,
        blueTickStatus: 'none',
        blueTickRequirements: {
          documentsSubmitted: false,
          identityVerified: false,
          licenseValidated: false,
          backgroundChecked: false,
          complianceVerified: false
        },
        verificationHistory: []
      };
    }

    // Initialize verificationHistory if it doesn't exist
    if (!agent.agentProfile.verificationHistory) {
      agent.agentProfile.verificationHistory = [];
    }

    const timestamp = new Date();
    const historyEntry = {
      action: action === 'grant' ? 'granted' : action === 'suspend' ? 'suspended' : 'reinstated',
      reason: reason || 'No reason provided',
      adminId: adminUser._id.toString(),
      adminName: adminUser.fullName,
      timestamp
    };

    // Update blue tick status based on action
    switch (action) {
      case 'grant':
        agent.agentProfile.blueTickStatus = 'verified';
        agent.agentProfile.blueTickVerifiedAt = timestamp;
        agent.agentProfile.blueTickVerifiedBy = adminUser._id.toString();
        agent.agentProfile.verified = true;
        break;

      case 'suspend':
        agent.agentProfile.blueTickStatus = 'suspended';
        agent.agentProfile.blueTickSuspendedAt = timestamp;
        agent.agentProfile.blueTickSuspendedBy = adminUser._id.toString();
        agent.agentProfile.blueTickSuspensionReason = reason;
        agent.agentProfile.verified = false;
        break;

      case 'reinstate':
        agent.agentProfile.blueTickStatus = 'verified';
        agent.agentProfile.blueTickVerifiedAt = timestamp;
        agent.agentProfile.blueTickVerifiedBy = adminUser._id.toString();
        agent.agentProfile.blueTickSuspendedAt = undefined;
        agent.agentProfile.blueTickSuspendedBy = undefined;
        agent.agentProfile.blueTickSuspensionReason = undefined;
        agent.agentProfile.verified = true;
        break;
    }

    // Add to verification history
    agent.agentProfile.verificationHistory.push(historyEntry);

    await agent.save();

    return NextResponse.json({
      success: true,
      message: `Blue tick ${action}ed successfully`,
      data: {
        agentId: agent._id,
        agentName: agent.fullName,
        blueTickStatus: agent.agentProfile.blueTickStatus,
        action: historyEntry.action,
        timestamp: historyEntry.timestamp
      }
    });

  } catch (error) {
    console.error('Blue tick management error:', error);
    return NextResponse.json(
      { error: 'Failed to manage blue tick verification' },
      { status: 500 }
    );
  }
}

// Get all agents with blue tick status
export async function GET(req: NextRequest) {
  try {
    // Connect to database
    try {
      await dbConnect();
    } catch (dbError: any) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please check your MongoDB connection string.' },
        { status: 500 }
      );
    }

    // Session auth
    const cookie = req.cookies.get('kobac_session')?.value || req.cookies.get('kobac_session_alt')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session: { userId: string; role: string } | null = null;
    try {
      session = JSON.parse(decodeURIComponent(cookie));
    } catch (parseError: any) {
      console.error('❌ Error parsing session cookie:', parseError);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ultimate superadmin
    let adminUser;
    try {
      adminUser = await User.findById(session.userId);
    } catch (queryError: any) {
      console.error('❌ Error querying admin user:', queryError);
      return NextResponse.json(
        { error: 'Error querying user from database' },
        { status: 500 }
      );
    }

    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (adminUser.phone !== ULTIMATE_SUPERADMIN_PHONE || 
        adminUser.fullName !== ULTIMATE_SUPERADMIN_NAME) {
      return NextResponse.json({ 
        error: 'Only the ultimate superadmin can view blue tick status',
        code: 'ULTIMATE_SUPERADMIN_REQUIRED'
      }, { status: 403 });
    }

    let agents;
    try {
      agents = await User.find({
        role: { $in: ['agent', 'agency'] }
      }).select('fullName phone role status agentProfile createdAt').lean();
    } catch (queryError: any) {
      console.error('❌ Error querying agents:', queryError);
      return NextResponse.json(
        { error: `Error querying agents: ${queryError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agents
    });

  } catch (error: any) {
    console.error('❌ Error fetching agents:', error);
    const errorMessage = error?.message || 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to fetch agents: ${errorMessage}` },
      { status: 500 }
    );
  }
}
