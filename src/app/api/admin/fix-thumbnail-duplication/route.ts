import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import { resolveImageUrl } from '@/lib/imageUrlResolver'
import { getSessionFromRequest } from '@/lib/sessionUtils'

/**
 * Admin API endpoint to fix thumbnail duplication in existing properties
 * Only accessible by superadmin users
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Admin: Starting thumbnail duplication fix...')
    
    // Debug: Log all cookies
    const allCookies = request.cookies.getAll()
    console.log('🍪 All cookies:', allCookies.map(c => ({ name: c.name, length: c.value.length })))
    
    // Check authentication using session utils
    const session = getSessionFromRequest(request)
    console.log('🔍 Session result:', session)
    
    if (!session) {
      console.log('❌ No valid session found')
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required',
        debug: { 
          cookies: allCookies.map(c => c.name),
          hasKobacSession: !!request.cookies.get('kobac_session'),
          hasKobacSessionAlt: !!request.cookies.get('kobac_session_alt')
        }
      }, { status: 401 })
    }

    console.log('👑 Admin API auth check:', { userId: session.userId, role: session.role })
    
    // Allow superadmin, agency roles
    const allowedRoles = ['superadmin', 'super_admin', 'agency']
    
    if (!allowedRoles.includes(session.role)) {
      console.log('❌ Access denied for role:', session.role)
      return NextResponse.json({ 
        success: false, 
        error: 'Superadmin access required' 
      }, { status: 403 })
    }
    
    console.log('✅ Admin authentication verified for role:', session.role)
    
    // Connect to database
    console.log('🔗 Connecting to database...')
    await connectDB()
    console.log('✅ Database connected successfully')
    
    // Get all properties with images
    console.log('🔍 Finding properties with images...')
    const properties = await Property.find({
      $and: [
        { thumbnailImage: { $exists: true, $nin: [null, ''] } },
        { images: { $exists: true, $ne: null, $not: { $size: 0 } } }
      ]
    })
    console.log('✅ Properties query completed')
    
    console.log(`📊 Found ${properties.length} properties with both thumbnail and additional images`)
    
    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No properties found that need fixing',
        data: {
          propertiesProcessed: 0,
          propertiesFixed: 0,
          totalDuplicatesRemoved: 0,
          fixedProperties: []
        }
      })
    }
    
    let totalFixed = 0
    let totalDuplicatesRemoved = 0
    const fixedProperties = []
    
    // Process each property
    console.log('🔄 Starting to process properties...')
    for (const property of properties) {
      try {
        console.log(`🔍 Processing property: ${property.title}`)
        const { thumbnailImage, images } = property
        
        // Skip if no thumbnail or no additional images
        if (!thumbnailImage || !images || !Array.isArray(images) || images.length === 0) {
          console.log(`⏭️ Skipping property ${property.title} - no images to process`)
          continue
        }
        
        // Resolve the thumbnail URL for comparison
        const resolvedThumbnail = resolveImageUrl(thumbnailImage)
        if (!resolvedThumbnail) {
          console.log(`⏭️ Skipping property ${property.title} - invalid thumbnail`)
          continue
        }
        
        // Filter out images that match the thumbnail
        const originalImages = [...images]
        const filteredImages = images.filter(img => {
          const resolvedImg = resolveImageUrl(img)
          return resolvedImg !== resolvedThumbnail
        })
        
        // Check if any duplicates were found
        if (originalImages.length === filteredImages.length) {
          console.log(`⏭️ Skipping property ${property.title} - no duplicates found`)
          continue // No duplicates found
        }
        
        const duplicatesRemoved = originalImages.length - filteredImages.length
        
        // Update the property in the database
        property.images = filteredImages
        property.updatedAt = new Date()
        await property.save()
        
        totalFixed++
        totalDuplicatesRemoved += duplicatesRemoved
        
        fixedProperties.push({
          id: property._id,
          title: property.title,
          duplicatesRemoved,
          originalCount: originalImages.length,
          newCount: filteredImages.length
        })
        
        console.log(`✅ Fixed property: "${property.title}" (${duplicatesRemoved} duplicates removed)`)
      } catch (error) {
        console.error(`❌ Error processing property "${property.title}":`, error)
      }
    }
    
    // Summary
    const summary = {
      propertiesProcessed: properties.length,
      propertiesFixed: totalFixed,
      totalDuplicatesRemoved,
      fixedProperties
    }
    
    console.log('📊 Fix Summary:', summary)
    
    return NextResponse.json({
      success: true,
      message: `Successfully fixed ${totalFixed} properties, removing ${totalDuplicatesRemoved} duplicate thumbnails`,
      data: summary
    })
    
  } catch (error) {
    console.error('❌ Error during thumbnail duplication fix:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error during thumbnail duplication fix',
      debug: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error
      }
    }, { status: 500 })
  }
}
