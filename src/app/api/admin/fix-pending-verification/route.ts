import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User, { UserStatus, UserRole } from '@/models/User'

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
    if (!adminUser || !adminUser.permissions?.canManageUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find all users with pending_verification status
    const pendingUsers = await User.find({ status: UserStatus.PENDING_VERIFICATION })
    
    let updatedCount = 0
    const results = []

    for (const user of pendingUsers) {
      let newStatus = UserStatus.ACTIVE
      
      // If user is an agent and has an avatar, set to ACTIVE
      if ([UserRole.AGENT, UserRole.AGENCY].includes(user.role as any) && user.profile?.avatar) {
        user.status = UserStatus.ACTIVE
        await user.save()
        updatedCount++
        results.push({
          userId: user._id,
          fullName: user.fullName,
          role: user.role,
          oldStatus: UserStatus.PENDING_VERIFICATION,
          newStatus: UserStatus.ACTIVE,
          reason: 'Agent with avatar - automatically activated'
        })
      }
      // If user is a regular user, set to ACTIVE
      else if ([UserRole.USER, UserRole.NORMAL_USER].includes(user.role as any)) {
        user.status = UserStatus.ACTIVE
        await user.save()
        updatedCount++
        results.push({
          userId: user._id,
          fullName: user.fullName,
          role: user.role,
          oldStatus: UserStatus.PENDING_VERIFICATION,
          newStatus: UserStatus.ACTIVE,
          reason: 'Regular user - automatically activated'
        })
      }
      // If user is an agent without avatar, keep as pending but note it
      else if ([UserRole.AGENT, UserRole.AGENCY].includes(user.role as any) && !user.profile?.avatar) {
        results.push({
          userId: user._id,
          fullName: user.fullName,
          role: user.role,
          oldStatus: UserStatus.PENDING_VERIFICATION,
          newStatus: UserStatus.PENDING_VERIFICATION,
          reason: 'Agent without avatar - requires avatar before activation'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updatedCount} users with pending verification status`,
      totalPending: pendingUsers.length,
      updated: updatedCount,
      results: results
    })

  } catch (e) {
    console.error('Error fixing pending verification:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
