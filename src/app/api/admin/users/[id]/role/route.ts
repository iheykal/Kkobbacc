import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User, { UserRole } from '@/models/User'
import { UserStatus } from '@/models/User'

// Ultimate superadmin protection - cannot be deleted or modified
const ULTIMATE_SUPERADMIN_PHONE = '0610251014'
const ULTIMATE_SUPERADMIN_NAME = 'Kobac Real Estate'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    // Session auth from cookie set on login
    const cookie = req.cookies.get('kobac_session')?.value
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let session: { userId: string; role: string } | null = null
    try {
      session = JSON.parse(decodeURIComponent(cookie))
    } catch (_) {}
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await User.findById(session.userId)
    if (!adminUser || !adminUser.permissions?.canManageRoles) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { role } = await req.json()
    console.log('🔍 Received role:', role)
    console.log('🔍 Allowed roles:', [UserRole.USER, UserRole.AGENCY, UserRole.SUPERADMIN])
    const allowed = [UserRole.USER, UserRole.AGENCY, UserRole.SUPERADMIN]
    if (!allowed.includes(role)) {
      console.log('🔍 Invalid role received:', role)
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const targetUser = await User.findById(params.id)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 🛡️ ULTIMATE PROTECTION: Prevent modification of the ultimate superadmin
    if (targetUser.phone === ULTIMATE_SUPERADMIN_PHONE || targetUser.fullName === ULTIMATE_SUPERADMIN_NAME) {
      return NextResponse.json({ 
        error: 'Forbidden: Cannot modify the ultimate superadmin. This account is protected and cannot be altered.',
        code: 'ULTIMATE_SUPERADMIN_PROTECTED'
      }, { status: 403 })
    }

    // Check if the admin user is the ultimate superadmin (Kobac superadmin)
    const isKobacSuperadmin = adminUser.phone === ULTIMATE_SUPERADMIN_PHONE || 
                              adminUser.fullName === ULTIMATE_SUPERADMIN_NAME ||
                              adminUser.fullName.toLowerCase().includes('kobac')

    // Protect superadmin demotion - only allow if admin is Kobac superadmin
    if (targetUser.role === UserRole.SUPERADMIN && !isKobacSuperadmin) {
      return NextResponse.json({ error: 'Only the Kobac superadmin can modify other superadmins' }, { status: 403 })
    }

    // Allow Kobac superadmin to demote other superadmins to any role
    if (targetUser.role === UserRole.SUPERADMIN && role !== UserRole.SUPERADMIN) {
      if (!isKobacSuperadmin) {
        return NextResponse.json({ error: 'Superadmin cannot be demoted' }, { status: 400 })
      }
      // Log the demotion for audit purposes
      console.log(`🔍 Kobac superadmin ${adminUser.fullName} is demoting superadmin ${targetUser.fullName} from ${targetUser.role} to ${role}`)
    }

    // 🖼️ AVATAR REQUIREMENT: Check if promoting to agent role requires avatar
    const isPromotingToAgent = [UserRole.AGENT, UserRole.AGENCY].includes(role as any)
    if (isPromotingToAgent) {
      const currentAvatar = (targetUser as any).profile?.avatar
      if (!currentAvatar) {
        return NextResponse.json({ 
          error: 'Profile picture is required to promote user to agent role. Please set a profile picture first.',
          code: 'AVATAR_REQUIRED_FOR_AGENT'
        }, { status: 400 })
      }
      
      // Since avatar is required and present, automatically set status to ACTIVE
      targetUser.status = UserStatus.ACTIVE
    }

    // Assign and save to trigger pre('save') hook for permissions/status
    targetUser.role = role as any
    await targetUser.save()

    const safe = await User.findById(targetUser._id).select('_id fullName phone role status permissions updatedAt')
    return NextResponse.json(safe)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
