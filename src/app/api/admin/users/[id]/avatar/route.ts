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
    if (!adminUser || !adminUser.permissions?.canManageUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { avatar } = await req.json()
    if (!avatar) {
      return NextResponse.json({ error: 'Avatar URL is required' }, { status: 400 })
    }

    const targetUser = await User.findById(params.id)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update the user's profile with the new avatar
    if (!targetUser.profile) {
      targetUser.profile = {}
    }
    targetUser.profile.avatar = avatar

    await targetUser.save()

    console.log(`🖼️ Superadmin ${adminUser.fullName} set avatar for user ${targetUser.fullName}`)

    const safe = await User.findById(targetUser._id).select('_id fullName phone role status profile.avatar updatedAt')
    return NextResponse.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: safe
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
