import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Property from '@/models/Property'

// Ultimate superadmin protection - cannot be deleted or modified
const ULTIMATE_SUPERADMIN_PHONE = '0610251014'
const ULTIMATE_SUPERADMIN_NAME = 'Kobac Real Estate'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if user is superadmin
    const adminUser = await User.findById(session.userId)
    if (!adminUser || adminUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Only superadmin can delete agents' }, { status: 403 })
    }

    // Find the target user
    const targetUser = await User.findById(params.id)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 🛡️ ULTIMATE PROTECTION: Prevent deletion of the ultimate superadmin
    if (targetUser.phone === ULTIMATE_SUPERADMIN_PHONE || targetUser.fullName === ULTIMATE_SUPERADMIN_NAME) {
      return NextResponse.json({ 
        error: 'Forbidden: Cannot delete the ultimate superadmin. This account is protected and cannot be removed from the system.',
        code: 'ULTIMATE_SUPERADMIN_PROTECTED'
      }, { status: 403 })
    }

    // Prevent superadmin from deleting themselves
    if (targetUser._id.toString() === session.userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Check if the admin user is the ultimate superadmin (Kobac superadmin)
    const isKobacSuperadmin = adminUser.phone === ULTIMATE_SUPERADMIN_PHONE || 
                              adminUser.fullName === ULTIMATE_SUPERADMIN_NAME ||
                              adminUser.fullName.toLowerCase().includes('kobac')

    // Prevent superadmin from deleting other superadmins (unless admin is Kobac superadmin)
    if (targetUser.role === 'superadmin' && !isKobacSuperadmin) {
      return NextResponse.json({ error: 'Cannot delete other superadmins' }, { status: 400 })
    }

    // Log the deletion for audit purposes
    if (targetUser.role === 'superadmin' && isKobacSuperadmin) {
      console.log(`🔍 Kobac superadmin ${adminUser.fullName} is deleting superadmin ${targetUser.fullName} (${targetUser.phone})`)
    } else {
      console.log(`🗑️ Superadmin ${adminUser.fullName} is deleting agent ${targetUser.fullName} (${targetUser.phone})`)
    }

    // Get user's phone number before deletion for logging
    const userPhone = targetUser.phone
    const userName = targetUser.fullName
    const userRole = targetUser.role

    // Delete all properties associated with this user
    const propertiesResult = await Property.deleteMany({ agentId: params.id })
    console.log(`🗑️ Deleted ${propertiesResult.deletedCount} properties for user ${userName}`)

    // Completely delete the user from database
    const deleteResult = await User.findByIdAndDelete(params.id)
    if (!deleteResult) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    console.log(`✅ Successfully deleted user ${userName} (${userPhone}) and all associated data`)

    return NextResponse.json({
      success: true,
      message: `Agent ${userName} has been completely removed from the system`,
      data: {
        deletedUser: {
          id: params.id,
          name: userName,
          phone: userPhone,
          role: userRole
        },
        deletedProperties: propertiesResult.deletedCount,
        deletedBy: adminUser.fullName,
        deletedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
