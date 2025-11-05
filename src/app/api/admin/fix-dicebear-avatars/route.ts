import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { DEFAULT_AVATAR_URL } from '@/lib/utils'

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

    console.log('🔧 Starting DiceBear avatar URL fix...')
    
    // Find all users with DiceBear URLs
    const usersWithDiceBear = await User.find({
      $or: [
        { 'profile.avatar': { $regex: 'api.dicebear.com', $options: 'i' } },
        { avatar: { $regex: 'api.dicebear.com', $options: 'i' } }
      ]
    })
    
    console.log(`📊 Found ${usersWithDiceBear.length} users with DiceBear URLs`)
    
    if (usersWithDiceBear.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No DiceBear URLs found. All avatars are already fixed!',
        data: { updatedCount: 0, totalFound: 0 }
      })
    }
    
    // Update all users with DiceBear URLs
    let updatedCount = 0
    const updatedUsers = []
    
    for (const user of usersWithDiceBear) {
      let needsUpdate = false
      const originalProfileAvatar = user.profile?.avatar
      const originalAvatar = user.avatar
      
      // Check and fix profile.avatar
      if (user.profile?.avatar && user.profile.avatar.includes('api.dicebear.com')) {
        console.log(`🔄 Fixing profile.avatar for user ${user.fullName}: ${user.profile.avatar}`)
        user.profile.avatar = DEFAULT_AVATAR_URL
        needsUpdate = true
      }
      
      // Check and fix top-level avatar
      if (user.avatar && user.avatar.includes('api.dicebear.com')) {
        console.log(`🔄 Fixing avatar for user ${user.fullName}: ${user.avatar}`)
        user.avatar = DEFAULT_AVATAR_URL
        needsUpdate = true
      }
      
      if (needsUpdate) {
        await user.save()
        updatedCount++
        updatedUsers.push({
          id: user._id,
          fullName: user.fullName,
          phone: user.phone,
          originalProfileAvatar,
          originalAvatar,
          newProfileAvatar: user.profile?.avatar,
          newAvatar: user.avatar
        })
        console.log(`✅ Updated user ${user.fullName}`)
      }
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} users`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} users with DiceBear avatar URLs`,
      data: {
        updatedCount,
        totalFound: usersWithDiceBear.length,
        updatedUsers
      }
    })
    
  } catch (error) {
    console.error('❌ Error fixing DiceBear avatars:', error)
    return NextResponse.json({ 
      error: 'Failed to fix DiceBear avatars',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
