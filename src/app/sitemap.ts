import { MetadataRoute } from 'next'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kobac-real-estate.onrender.com'
  
  // Static pages - always return these
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]
  
  // During build time, MongoDB might not be available or might be a dummy value
  // Check if MONGODB_URI is a dummy value (set in Dockerfile for build)
  const mongoUri = process.env.MONGODB_URI || ''
  const isDummyMongoUri = mongoUri.includes('dummy') || mongoUri.includes('mongodb://dummy')
  
  // During build time, return only static pages to prevent build failures
  if (process.env.NODE_ENV === 'production' && (isDummyMongoUri || !mongoUri)) {
    console.warn('MongoDB URI not available during build, returning static sitemap only')
    return staticPages
  }
  
  try {
    // Connect to database
    await connectDB()
    
    // Fetch all active properties
    const properties = await Property.find({
      deletionStatus: { $ne: 'deleted' },
      isExpired: { $ne: true }
    })
    .select('propertyId propertyType status listingType district location createdAt updatedAt')
    .lean()
    
    // Generate property URLs
    const propertyUrls = properties.map(property => {
      const propertyType = property.propertyType?.toLowerCase().replace(/\s+/g, '-') || 'property'
      const status = property.status?.toLowerCase().replace(/\s+/g, '-') || property.listingType || ''
      const city = 'muqdisho' // Default city
      const district = property.district?.toLowerCase().replace(/\s+/g, '-') || 'unknown'
      
      // Generate SEO-friendly URL
      const seoUrl = `/${propertyType}-${status}-ah/${city}/degmada-${district}/${property.propertyId}`
      
      return {
        url: `${baseUrl}${seoUrl}`,
        lastModified: property.updatedAt || property.createdAt || new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }
    })
    
    return [...staticPages, ...propertyUrls]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Return basic sitemap if database fails - don't fail the build
    return staticPages
  }
}




