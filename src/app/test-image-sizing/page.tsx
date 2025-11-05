'use client';

import { useState } from 'react';
import { AdaptivePropertyImage } from '@/components/ui/AdaptivePropertyImage';
import { ResponsivePropertyImage } from '@/components/ui/ResponsivePropertyImage';
import { PropertyImageWithWatermark } from '@/components/ui/PropertyImageWithWatermark';

// Mock property data for testing
const mockProperty = {
  _id: 'test-property',
  title: 'Test Property',
  thumbnailImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
  images: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=400&fit=crop'
  ]
};

export default function TestImageSizingPage() {
  const [selectedMode, setSelectedMode] = useState<'contain' | 'cover' | 'adaptive'>('adaptive');
  const [selectedImage, setSelectedImage] = useState(0);

  const imageModes = [
    { value: 'contain', label: 'Contain (Show Full Image)', description: 'Shows the entire image, may have empty space' },
    { value: 'cover', label: 'Cover (Fill Container)', description: 'Fills the container, may crop the image' },
    { value: 'adaptive', label: 'Adaptive (Smart Sizing)', description: 'Chooses best strategy based on aspect ratios' }
  ];

  const testImages = [
    { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', name: 'Landscape (4:3)' },
    { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=800&fit=crop', name: 'Portrait (3:4)' },
    { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=400&fit=crop', name: 'Wide (3:1)' },
    { url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=1200&fit=crop', name: 'Tall (1:3)' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🖼️ Image Sizing Test Page
          </h1>
          
          {/* Controls */}
          <div className="mb-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Sizing Mode</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {imageModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedMode(mode.value as any)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedMode === mode.value
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {testImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedImage === index
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{img.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Containers */}
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-800">Responsive Behavior</h2>
            
            {/* Mobile-like container */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Mobile (Small Container)</h3>
              <div className="w-full max-w-sm mx-auto">
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
                  <AdaptivePropertyImage
                    property={{ ...mockProperty, thumbnailImage: testImages[selectedImage].url }}
                    alt="Test Property"
                    className="w-full h-full"
                    showWatermark={true}
                    watermarkPosition="center"
                    watermarkSize="small"
                    sizingMode={selectedMode}
                  />
                </div>
              </div>
            </div>

            {/* Desktop-like container */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Desktop (Large Container)</h3>
              <div className="w-full max-w-4xl mx-auto">
                <div className="relative h-80 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
                  <AdaptivePropertyImage
                    property={{ ...mockProperty, thumbnailImage: testImages[selectedImage].url }}
                    alt="Test Property"
                    className="w-full h-full"
                    showWatermark={true}
                    watermarkPosition="center"
                    watermarkSize="medium"
                    sizingMode={selectedMode}
                  />
                </div>
              </div>
            </div>

            {/* Wide container */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Wide Container (16:9)</h3>
              <div className="w-full max-w-6xl mx-auto">
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
                  <AdaptivePropertyImage
                    property={{ ...mockProperty, thumbnailImage: testImages[selectedImage].url }}
                    alt="Test Property"
                    className="w-full h-full"
                    showWatermark={true}
                    watermarkPosition="center"
                    watermarkSize="large"
                    sizingMode={selectedMode}
                  />
                </div>
              </div>
            </div>

            {/* Square container */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Square Container (1:1)</h3>
              <div className="w-full max-w-md mx-auto">
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
                  <AdaptivePropertyImage
                    property={{ ...mockProperty, thumbnailImage: testImages[selectedImage].url }}
                    alt="Test Property"
                    className="w-full h-full"
                    showWatermark={true}
                    watermarkPosition="center"
                    watermarkSize="medium"
                    sizingMode={selectedMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comparison with old method */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Comparison: Old vs New</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Old method */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">Old Method (object-cover)</h3>
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
                  <img
                    src={testImages[selectedImage].url}
                    alt="Test Property"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Always crops to fill container, may cut off important parts
                </p>
              </div>

              {/* New method */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">New Method (Adaptive)</h3>
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
                  <AdaptivePropertyImage
                    property={{ ...mockProperty, thumbnailImage: testImages[selectedImage].url }}
                    alt="Test Property"
                    className="w-full h-full"
                    showWatermark={false}
                    sizingMode="adaptive"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Smart sizing that shows full image when possible
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
