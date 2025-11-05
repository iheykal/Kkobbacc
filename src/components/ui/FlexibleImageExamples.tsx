'use client';

import React from 'react';
import { FlexibleImage, PropertyImageGallery } from './FlexibleImage';

/**
 * Example component showing different ways to use FlexibleImage
 * This is for demonstration purposes only
 */
export const FlexibleImageExamples: React.FC = () => {
  const sampleImages = [
    '/icons/villa-2.webp',
    '/icons/yellow-villah.webp',
    '/icons/happy-family.webp'
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">FlexibleImage Examples</h1>
      
      {/* Example 1: Basic flexible image with auto aspect ratio */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">1. Basic Flexible Image (Auto Aspect Ratio)</h2>
        <div className="w-full max-w-md mx-auto">
          <FlexibleImage
            src="/icons/villa-2.webp"
            alt="Villa example"
            aspectRatio="auto"
            objectFit="contain"
            className="rounded-lg"
          />
        </div>
      </div>

      {/* Example 2: Fixed aspect ratio (16:9) */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">2. Fixed Aspect Ratio (16:9 Video)</h2>
        <div className="w-full max-w-2xl mx-auto">
          <FlexibleImage
            src="/icons/villa-2.webp"
            alt="Villa example"
            aspectRatio="video"
            objectFit="contain"
            className="rounded-lg"
          />
        </div>
      </div>

      {/* Example 3: Square aspect ratio with zoom */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">3. Square Aspect Ratio with Zoom</h2>
        <div className="w-full max-w-sm mx-auto">
          <FlexibleImage
            src="/icons/villa-2.webp"
            alt="Villa example"
            aspectRatio="square"
            objectFit="contain"
            enableZoom={true}
            className="rounded-lg"
          />
        </div>
      </div>

      {/* Example 4: With watermark */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">4. With Watermark</h2>
        <div className="w-full max-w-lg mx-auto">
          <FlexibleImage
            src="/icons/villa-2.webp"
            alt="Villa example"
            aspectRatio="auto"
            objectFit="contain"
            watermark={{
              src: "/icons/header.png",
              position: "center",
              size: "large",
              opacity: 0.7
            }}
            className="rounded-lg"
          />
        </div>
      </div>

      {/* Example 5: Full gallery */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">5. Full Property Gallery</h2>
        <div className="w-full max-w-4xl mx-auto">
          <PropertyImageGallery
            images={sampleImages}
            altPrefix="Sample Property"
            aspectRatio="auto"
            objectFit="contain"
            enableZoom={true}
            showThumbnails={true}
            autoPlay={false}
            watermark={{
              src: "/icons/header.png",
              position: "center",
              size: "large",
              opacity: 0.7
            }}
          />
        </div>
      </div>

      {/* Example 6: Different object fit modes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">6. Different Object Fit Modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Contain (No Cropping)</h3>
            <div className="w-full h-48">
              <FlexibleImage
                src="/icons/villa-2.webp"
                alt="Villa example"
                aspectRatio="video"
                objectFit="contain"
                className="rounded-lg"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Cover (Fill Container)</h3>
            <div className="w-full h-48">
              <FlexibleImage
                src="/icons/villa-2.webp"
                alt="Villa example"
                aspectRatio="video"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlexibleImageExamples;
