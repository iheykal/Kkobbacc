import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Head from 'next/head';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import SinglePropertyClient from '@/components/sections/SinglePropertyClient';
import { parseSEOUrl, generateSEOUrl } from '@/lib/seoUrlUtils';
import { Metadata, ResolvingMetadata } from 'next';

// Helper to serialize MongoDB document to plain object
function serializeProperty(doc: any) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;

  // Convert _id and dates to strings
  obj._id = obj._id.toString();
  if (obj.agentId && obj.agentId._id) obj.agentId._id = obj.agentId._id.toString();
  else if (obj.agentId) obj.agentId = obj.agentId.toString();

  if (obj.createdAt) obj.createdAt = new Date(obj.createdAt).toISOString();
  if (obj.updatedAt) obj.updatedAt = new Date(obj.updatedAt).toISOString();
  if (obj.uniqueViewers) obj.uniqueViewers = obj.uniqueViewers.map((v: any) => v.toString());

  return obj;
}

interface PageProps {
  params: {
    segments: string[];
  };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const property = await getPropertyData(params.segments);

  if (!property) {
    return {
      title: 'Property Not Found',
    };
  }

  return {
    title: `${property.title} - ${property.district} | Kobac Property`,
    description: `${property.description.substring(0, 160)}... Located in ${property.district}, ${property.location}. ${property.propertyType} for ${property.status.toLowerCase()}.`,
    keywords: [property.propertyType, property.district, property.location, 'real estate', 'property', property.status.toLowerCase()],
    openGraph: {
      title: `${property.title} - ${property.district}`,
      description: property.description.substring(0, 160),
      images: [property.thumbnailImage || '/icons/kobac.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${property.title} - ${property.district}`,
      description: property.description.substring(0, 160),
      images: [property.thumbnailImage || '/icons/kobac.png'],
    },
  };
}

async function getPropertyData(segments: string[]) {
  const segmentsPath = Array.isArray(segments) ? `/${segments.join('/')}` : '';
  const parsedUrl = segmentsPath ? parseSEOUrl(segmentsPath) : null;

  let propertyId: string | null = null;

  if (parsedUrl?.propertyId) {
    propertyId = String(parsedUrl.propertyId);
  } else if (segments && segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    const numericId = parseInt(lastSegment);
    if (!isNaN(numericId) && isFinite(numericId)) {
      propertyId = String(numericId);
    } else {
      propertyId = lastSegment;
    }
  }

  if (!propertyId) return null;

  try {
    await connectDB();

    let property = null;

    // Try to find by propertyId first (numeric)
    if (!isNaN(Number(propertyId))) {
      property = await Property.findOne({
        propertyId: Number(propertyId),
        deletionStatus: { $ne: 'deleted' }
      }).populate('agentId', 'fullName phone avatar');
    }

    // If not found, try by _id
    if (!property && propertyId.match(/^[0-9a-fA-F]{24}$/)) {
      property = await Property.findById(propertyId).populate('agentId', 'fullName phone avatar');
      if (property && property.deletionStatus === 'deleted') property = null;
    }

    if (!property) return null;

    return serializeProperty(property);
  } catch (error) {
    console.error('Error fetching property data:', error);
    return null;
  }
}

export default async function SEOPropertyPage({ params }: PageProps) {
  const property = await getPropertyData(params.segments);

  if (!property) {
    notFound();
  }

  return (
    <>
      {/* Schema.org Structured Data using next/head or just plain script in body since we are in Server Component */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": property.title,
            "description": property.description,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": property.district,
              "addressRegion": property.location,
              "addressCountry": "SO"
            },
            "offers": {
              "@type": "Offer",
              "price": property.price,
              "priceCurrency": "USD",
              "availability": property.status === 'For Rent' ? "https://schema.org/RentalAvailability" : "https://schema.org/InStock"
            },
            "image": property.thumbnailImage || property.images?.[0],
            "datePosted": property.createdAt,
            "floorSize": property.sqft ? {
              "@type": "QuantitativeValue",
              "value": property.sqft,
              "unitCode": "SQF"
            } : undefined,
            "numberOfBedroomsTotal": property.beds,
            "numberOfBathroomsTotal": property.baths,
            "yearBuilt": property.yearBuilt
          })
        }}
      />

      <SinglePropertyClient initialProperty={property} />
    </>
  );
}

