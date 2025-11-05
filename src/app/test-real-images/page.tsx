'use client';

import { useState, useEffect } from 'react';
import PropertyImage from '@/components/ui/PropertyImage';
import { usePropertyImages } from '@/components/ui/PropertyImage';

export default function TestRealImages() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/properties?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setProperties(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch properties');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchProperties}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Real Images Test
          </h1>
          <p className="text-gray-600 mb-6">
            This page tests that properties display their actual uploaded images from Cloudflare R2.
            Properties without images will show a neutral fallback instead of placeholder images.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">✅ What to Look For:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Properties with uploaded images should show the actual R2 images</li>
              <li>• Properties without images should show a neutral gray placeholder</li>
              <li>• No hardcoded placeholder images (picsum.photos, etc.) should appear</li>
              <li>• Images should load from Cloudflare R2 URLs</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property, index) => {
            const { primaryImageUrl, allImageUrls, hasImages, imageCount } = usePropertyImages(property);
            
            return (
              <div key={property._id || property.propertyId || index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Property Image */}
                <div className="h-48 bg-gray-200">
                  <PropertyImage
                    property={property}
                    alt={property.title}
                    className="w-full h-full"
                    loading="lazy"
                    onError={(error) => {
                      console.error('Property image error:', {
                        propertyId: property._id || property.propertyId,
                        title: property.title,
                        error
                      });
                    }}
                  />
                </div>

                {/* Property Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {property.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Location:</span> {property.location}</p>
                    <p><span className="font-medium">Price:</span> ${property.price?.toLocaleString()}</p>
                    <p><span className="font-medium">Type:</span> {property.propertyType}</p>
                  </div>

                  {/* Image Information */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">🖼️ Image Status</h4>
                    <div className="space-y-1 text-xs">
                      <p><span className="font-medium">Has Images:</span> {hasImages ? '✅ Yes' : '❌ No'}</p>
                      <p><span className="font-medium">Image Count:</span> {imageCount}</p>
                      <p><span className="font-medium">Primary URL:</span></p>
                      <p className="text-xs text-gray-500 break-all">
                        {primaryImageUrl || 'No primary image'}
                      </p>
                      {allImageUrls.length > 0 && (
                        <>
                          <p><span className="font-medium">All URLs:</span></p>
                          {allImageUrls.map((url, idx) => (
                            <p key={idx} className="text-xs text-gray-500 break-all">
                              {idx + 1}. {url}
                            </p>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Raw Data (for debugging) */}
                  <details className="mt-4">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      🔍 Raw Property Data
                    </summary>
                    <pre className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify({
                        _id: property._id,
                        propertyId: property.propertyId,
                        thumbnailImage: property.thumbnailImage,
                        images: property.images,
                        image: property.image
                      }, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            );
          })}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No properties found</div>
            <p className="text-gray-400">Try creating a property with images first.</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <button 
            onClick={fetchProperties}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh Properties
          </button>
        </div>
      </div>
    </div>
  );
}
