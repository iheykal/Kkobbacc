'use client'

import { useEffect } from 'react'

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

export default function TestGAPage() {
  useEffect(() => {
    // Test if Google Analytics is loaded
    const checkGA = () => {
      if (typeof window !== 'undefined' && window.gtag) {
        console.log('✅ Google Analytics is loaded and working!')
        console.log('GA ID:', process.env.NEXT_PUBLIC_GA_ID)
        
        // Send a test event
        window.gtag('event', 'test_event', {
          event_category: 'test',
          event_label: 'GA Test Page',
          value: 1
        })
      } else {
        console.log('❌ Google Analytics is not loaded')
        console.log('GA ID:', process.env.NEXT_PUBLIC_GA_ID)
      }
    }

    // Check immediately and after a delay
    checkGA()
    setTimeout(checkGA, 2000)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Google Analytics Test Page
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Current Configuration:
            </h2>
            <p className="text-blue-800">
              <strong>GA ID:</strong> {process.env.NEXT_PUBLIC_GA_ID || 'Not set'}
            </p>
            <p className="text-blue-800">
              <strong>Environment:</strong> {process.env.NODE_ENV}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              Instructions:
            </h2>
            <ol className="text-green-800 space-y-1">
              <li>1. Open your browser's Developer Tools (F12)</li>
              <li>2. Go to the Console tab</li>
              <li>3. Look for Google Analytics initialization messages</li>
              <li>4. Check if gtag function is available on window object</li>
              <li>5. Visit your Google Analytics dashboard to see if data is being received</li>
            </ol>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">
              Troubleshooting:
            </h2>
            <ul className="text-yellow-800 space-y-1">
              <li>• Make sure NEXT_PUBLIC_GA_ID environment variable is set</li>
              <li>• Check that Google Analytics scripts are loading properly</li>
              <li>• Verify the GA ID matches your Google Analytics property</li>
              <li>• Wait up to 48 hours for data to appear in GA dashboard</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
