import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User, { UserStatus, UserRole } from '@/models/User'

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
    if (!adminUser || !adminUser.permissions?.canManageUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status, avatar } = await req.json()
    const allowed = Object.values(UserStatus)
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const targetUser = await User.findById(params.id)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If approving an agent, enforce avatar presence
    const isAgentRole = [UserRole.AGENT, UserRole.AGENCY].includes(targetUser.role as any)
    if (isAgentRole && status === UserStatus.ACTIVE) {
      const currentAvatar = (targetUser as any).profile?.avatar
      if (!currentAvatar && !avatar) {
        return NextResponse.json({ error: 'Avatar required to approve agent', code: 'AVATAR_REQUIRED' }, { status: 400 })
      }
      if (avatar) {
        (targetUser as any).profile = { ...(targetUser as any).profile, avatar }
      }
    }

    targetUser.status = status
    await targetUser.save()

    const safe = await User.findById(targetUser._id).select('_id fullName phone role status permissions updatedAt')
    return NextResponse.json(safe)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


