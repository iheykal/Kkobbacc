'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function FixDuplicateImagesPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runFix = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/fix-duplicate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to fix duplicate images');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🔧 Fix Duplicate Images
            </h1>
            <p className="text-gray-600">
              This tool will identify and fix properties where the thumbnail image appears 
              in the images array, causing duplicate images in the gallery.
            </p>
          </div>

          {/* Info Box */}
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-blue-800 mb-3">📋 What This Tool Does</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>This tool will:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Find all properties with images</li>
                <li>Identify properties where thumbnailImage appears in the images array</li>
                <li>Remove the duplicate thumbnail from the images array</li>
                <li>Update the database with the cleaned data</li>
                <li>Show a summary of what was fixed</li>
              </ul>
            </div>
          </div>

          {/* Run Button */}
          <div className="mb-8">
            <button
              onClick={runFix}
              disabled={isRunning}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
            >
              {isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Fixing Duplicates...</span>
                </>
              ) : (
                <>
                  <span>🔧</span>
                  <span>Fix Duplicate Images</span>
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <h3 className="font-semibold text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Results Display */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                <h3 className="font-semibold text-green-800 mb-4">✅ Fix Completed Successfully</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{result.data.totalProperties}</div>
                    <div className="text-gray-600">Total Properties</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{result.data.duplicatesFound}</div>
                    <div className="text-gray-600">Duplicates Found</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.data.propertiesFixed}</div>
                    <div className="text-gray-600">Properties Fixed</div>
                  </div>
                </div>
              </div>

              {/* Fixed Properties List */}
              {result.data.fixedProperties.length > 0 && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-4">📋 Fixed Properties</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {result.data.fixedProperties.map((property: any, index: number) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="font-medium text-gray-900 mb-2">
                          {property.title} (ID: {property.id})
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Thumbnail:</span> {property.thumbnail}
                          </div>
                          <div>
                            <span className="font-medium">Original Images:</span> {property.originalImages.length} images
                          </div>
                          <div>
                            <span className="font-medium">Cleaned Images:</span> {property.cleanedImages.length} images
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

