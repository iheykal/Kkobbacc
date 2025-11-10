import { Metadata } from 'next'

export interface PropertyForMetadata {
  title: string
  description: string
  district: string
  location: string
  propertyType: string
  status: string
  listingType: string
  price: number
  thumbnailImage?: string
  images?: string[]
  beds: number
  baths: number
  sqft?: number
  yearBuilt: number
  createdAt: string
  updatedAt: string
  propertyId?: number | string
  _id?: string
}

export interface GenerateMetadataParams {
  property: PropertyForMetadata
  baseUrl: string
  seoUrl: string
}

/**
 * Generates comprehensive SEO metadata for property pages
 */
export function generatePropertyMetadata({ property, baseUrl, seoUrl }: GenerateMetadataParams): Metadata {
  const title = `${property.title} - ${property.district} | Kobac Real Estate`
  const description = `${property.description.substring(0, 160)}... Located in ${property.district}, ${property.location}. ${property.propertyType} for ${property.status.toLowerCase()}.`
  const keywords = `${property.propertyType}, ${property.district}, ${property.location}, real estate, property, ${property.status.toLowerCase()}`
  const canonicalUrl = `${baseUrl}${seoUrl}`
  const imageUrl = property.thumbnailImage || property.images?.[0] || `${baseUrl}/icons/kobac.webp`

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${property.title} - ${property.district}`,
      description: property.description.substring(0, 160),
      url: canonicalUrl,
      siteName: 'Kobac Real Estate',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: property.title,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${property.title} - ${property.district}`,
      description: property.description.substring(0, 160),
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      // Generate JSON-LD structured data
      'schema:json-ld': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: property.title,
        description: property.description,
        address: {
          '@type': 'PostalAddress',
          addressLocality: property.district,
          addressRegion: property.location,
          addressCountry: 'SO',
        },
        offers: {
          '@type': 'Offer',
          price: property.price,
          priceCurrency: 'USD',
          availability: property.status === 'For Rent' || property.status === 'for-rent' || property.listingType === 'rent'
            ? 'https://schema.org/RentalAvailability'
            : 'https://schema.org/InStock',
        },
        image: imageUrl,
        url: canonicalUrl,
        datePosted: property.createdAt,
        floorSize: property.sqft
          ? {
              '@type': 'QuantitativeValue',
              value: property.sqft,
              unitCode: 'SQF',
            }
          : undefined,
        numberOfBedroomsTotal: property.beds,
        numberOfBathroomsTotal: property.baths,
        yearBuilt: property.yearBuilt,
      }),
    },
  }
}









