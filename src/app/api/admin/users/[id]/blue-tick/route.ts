import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    // Session auth
    const cookie = req.cookies.get('kobac_session')?.value
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let session: { userId: string; role: string } | null = null
    try { session = JSON.parse(decodeURIComponent(cookie)) } catch {}
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await User.findById(session.userId)
    // Allow superadmin, agency, and users with admin permissions
    const allowedRoles = ['superadmin', 'super_admin', 'agency'];
    const hasAdminPermissions = adminUser?.permissions?.canManageUsers;
    
    if (!adminUser || (!allowedRoles.includes(adminUser.role) && !hasAdminPermissions)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, reason } = await req.json()
    
    if (!['grant', 'suspend', 'reinstate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const targetUser = await User.findById(params.id)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is an agent
    if (!['agent', 'agency'].includes(targetUser.role)) {
      return NextResponse.json({ error: 'Only agents can receive blue tick verification' }, { status: 400 })
    }

    // Initialize agentProfile if it doesn't exist
    if (!targetUser.agentProfile) {
      targetUser.agentProfile = {
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
      }
    }

    const verificationHistory = {
      action: action === 'grant' ? 'granted' : action === 'suspend' ? 'suspended' : 'reinstated',
      reason: reason || 'No reason provided',
      adminId: adminUser._id,
      adminName: adminUser.fullName,
      timestamp: new Date()
    }

    // Update blue tick status
    if (action === 'grant') {
      targetUser.agentProfile.blueTickStatus = 'verified'
      targetUser.agentProfile.blueTickVerifiedAt = new Date()
      targetUser.agentProfile.blueTickVerifiedBy = adminUser._id
      targetUser.agentProfile.verified = true
    } else if (action === 'suspend') {
      targetUser.agentProfile.blueTickStatus = 'suspended'
      targetUser.agentProfile.blueTickSuspendedAt = new Date()
      targetUser.agentProfile.blueTickSuspendedBy = adminUser._id
      targetUser.agentProfile.blueTickSuspensionReason = reason
      targetUser.agentProfile.verified = false
    } else if (action === 'reinstate') {
      targetUser.agentProfile.blueTickStatus = 'verified'
      targetUser.agentProfile.blueTickVerifiedAt = new Date()
      targetUser.agentProfile.blueTickVerifiedBy = adminUser._id
      targetUser.agentProfile.verified = true
    }

    // Initialize verificationHistory array if it doesn't exist
    if (!targetUser.agentProfile.verificationHistory) {
      targetUser.agentProfile.verificationHistory = []
    }

    // Add to verification history
    targetUser.agentProfile.verificationHistory.push(verificationHistory)

    await targetUser.save()

    return NextResponse.json({ 
      success: true, 
      message: `Blue tick ${action}ed successfully`,
      blueTickStatus: targetUser.agentProfile.blueTickStatus,
      verified: targetUser.agentProfile.verified
    })

  } catch (error) {
    console.error('Error managing blue tick:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const user = await User.findById(params.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      blueTickStatus: user.agentProfile?.blueTickStatus || 'none',
      verified: user.agentProfile?.verified || false,
      verificationHistory: user.agentProfile?.verificationHistory || []
    })

  } catch (error) {
    console.error('Error fetching blue tick status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
