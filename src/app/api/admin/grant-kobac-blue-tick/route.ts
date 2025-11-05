import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(req: NextRequest) {
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

    // Find Kobac Real Estate agent
    const kobacAgent = await User.findOne({
      $or: [
        { fullName: { $regex: /kobac/i } },
        { 'profile.company': { $regex: /kobac/i } }
      ],
      role: { $in: ['agent', 'agency'] }
    })

    if (!kobacAgent) {
      return NextResponse.json({ error: 'Kobac Real Estate agent not found' }, { status: 404 })
    }

    // Initialize agentProfile if it doesn't exist
    if (!kobacAgent.agentProfile) {
      kobacAgent.agentProfile = {
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

    // Grant blue tick
    kobacAgent.agentProfile.blueTickStatus = 'verified'
    kobacAgent.agentProfile.blueTickVerifiedAt = new Date()
    kobacAgent.agentProfile.blueTickVerifiedBy = adminUser._id
    kobacAgent.agentProfile.verified = true

    // Initialize verificationHistory array if it doesn't exist
    if (!kobacAgent.agentProfile.verificationHistory) {
      kobacAgent.agentProfile.verificationHistory = []
    }

    // Add verification history
    kobacAgent.agentProfile.verificationHistory.push({
      action: 'granted',
      reason: 'Official company account - verified identity and business license',
      adminId: adminUser._id,
      adminName: adminUser.fullName,
      timestamp: new Date()
    })

    await kobacAgent.save()

    return NextResponse.json({ 
      success: true, 
      message: 'Blue tick granted to Kobac Real Estate successfully',
      agentName: kobacAgent.fullName,
      blueTickStatus: kobacAgent.agentProfile.blueTickStatus,
      verified: kobacAgent.agentProfile.verified
    })

  } catch (error) {
    console.error('Error granting blue tick to Kobac:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
