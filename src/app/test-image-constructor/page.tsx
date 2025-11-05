'use client'

import React, { useEffect } from 'react'

export default function TestImageConstructor() {
  useEffect(() => {
    // Test if we can access the global Image constructor
    try {
      console.log('Testing global Image constructor...')
      
      // Check if window is available
      if (typeof window === 'undefined') {
        console.error('❌ Window is not available (server-side)')
        return
      }
      
      // Try to create a new Image instance
      const img = new window.Image()
      console.log('✅ Successfully created Image instance:', img)
      
      // Test if it has the expected properties
      console.log('Image constructor available:', typeof window.Image)
      console.log('Image prototype:', window.Image.prototype)
      
    } catch (error) {
      console.error('❌ Error creating Image instance:', error)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Image Constructor Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <p className="text-gray-700">
            Check the browser console for test results. This page tests if the global Image constructor is accessible.
          </p>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">What this tests:</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Whether <code>new window.Image()</code> works</li>
              <li>If the global Image constructor is accessible</li>
              <li>If there are any name collisions with Next.js Image component</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
