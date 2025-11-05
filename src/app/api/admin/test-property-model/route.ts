import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Property model...')
    
    // Connect to database
    console.log('🔗 Connecting to database...')
    await connectDB()
    console.log('✅ Database connected successfully')
    
    // Test Property model
    console.log('🔍 Testing Property.find()...')
    const properties = await Property.find({}).limit(1)
    console.log('✅ Property.find() completed successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Property model is working correctly',
      data: {
        propertiesFound: properties.length,
        sampleProperty: properties[0] ? {
          id: properties[0]._id,
          title: properties[0].title,
          hasThumbnail: !!properties[0].thumbnailImage,
          hasImages: !!properties[0].images,
          imagesCount: properties[0].images?.length || 0
        } : null
      }
    })
    
  } catch (error) {
    console.error('❌ Property model test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Property model test failed',
      debug: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 })
  }
}
