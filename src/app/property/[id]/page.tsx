import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { generateSEOUrl } from '@/lib/seoUrlUtils';

interface PageProps {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function PropertyPage({ params }: PageProps) {
  const propertyId = params.id;

  if (!propertyId) {
    redirect('/');
  }

  try {
    await connectDB();

    // Find property by _id or propertyId
    let property = null;

    if (propertyId.match(/^[0-9a-fA-F]{24}$/)) {
      property = await Property.findById(propertyId).select('status listingType propertyType district location propertyId title').lean();
    }

    // If not found by _id, try propertyId (numeric)
    if (!property && !isNaN(Number(propertyId))) {
      property = await Property.findOne({ propertyId: Number(propertyId) }).select('status listingType propertyType district location propertyId title').lean();
    }

    if (property) {
      // Generate full SEO URL directly on server
      const { seoUrl } = generateSEOUrl({
        propertyType: (property as any).propertyType,
        status: (property as any).status,
        listingType: (property as any).listingType,
        district: (property as any).district,
        location: (property as any).location,
        propertyId: (property as any).propertyId || (property as any)._id,
        _id: (property as any)._id
      });

      // Redirect immediately to the final destination
      redirect(seoUrl);
    } else {
      // Not found - redirect to home page
      redirect('/');
    }

  } catch (error) {
    console.error('Error in property redirect:', error);
    redirect('/');
  }
}
