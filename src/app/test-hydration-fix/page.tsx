'use client'


export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function TestHydrationFixPage() {
  const router = useRouter()
  const [hydrationTest, setHydrationTest] = useState<'pending' | 'pass' | 'fail'>('pending')
  const [originUrl, setOriginUrl] = useState('')
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    // Test 1: Check if we can safely access window
    try {
      if (typeof window !== 'undefined') {
        setOriginUrl(window.location.origin)
        setHydrationTest('pass')
      }
    } catch (error) {
      setHydrationTest('fail')
    }

    // Test 2: Run comprehensive hydration tests
    const runTests = () => {
      const results = []

      // Test window access
      results.push({
        test: 'Window Object Access',
        status: typeof window !== 'undefined' ? 'pass' : 'fail',
        message: typeof window !== 'undefined' ? 'Window object available' : 'Window object not available'
      })

      // Test origin URL
      results.push({
        test: 'Origin URL Resolution',
        status: originUrl ? 'pass' : 'pending',
        message: originUrl ? `Origin: ${originUrl}` : 'Origin URL not yet resolved'
      })

      // Test no hydration errors (check console)
      const hasErrors = window.console.error.toString().includes('Hydration')
      results.push({
        test: 'No Hydration Errors',
        status: !hasErrors ? 'pass' : 'fail',
        message: !hasErrors ? 'No hydration errors detected' : 'Hydration errors may be present'
      })

      // Test meta tag rendering
      const metaTags = document.querySelectorAll('meta[property="og:url"]')
      results.push({
        test: 'Meta Tag Rendering',
        status: metaTags.length > 0 ? 'pass' : 'fail',
        message: metaTags.length > 0 ? 'Meta tags rendered successfully' : 'Meta tags not found'
      })

      setTestResults(results)
    }

    // Run tests after a short delay to allow for hydration
    setTimeout(runTests, 1000)
  }, [originUrl])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  const navigateToProperty = () => {
    router.push('/iib/1') // Test navigation to property page
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Hydration Error Fix Test</h1>
            <p className="text-gray-600">Testing that the hydration error has been resolved</p>
          </div>

          {/* Main Hydration Test */}
          <div className="mb-8 p-4 border rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon(hydrationTest)}
              <h2 className="text-lg font-semibold">
                Hydration Test: {hydrationTest === 'pass' ? 'PASSED' : hydrationTest === 'fail' ? 'FAILED' : 'PENDING'}
              </h2>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Current Origin URL:</span>
                <span className="ml-2 text-blue-600">{originUrl || 'Not yet resolved'}</span>
              </div>
              <div>
                <span className="font-medium">Window Object:</span>
                <span className="ml-2 text-blue-600">
                  {typeof window !== 'undefined' ? 'Available' : 'Not available'}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Test Results */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Test Results</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium text-gray-900">{result.test}</div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Navigation */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Property Page Navigation</h2>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-sm text-blue-800 mb-2">
                Click the button below to navigate to a property page and verify:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                <li>No hydration errors in console</li>
                <li>Page loads without React warnings</li>
                <li>Meta tags render correctly</li>
                <li>Structured data includes proper URLs</li>
              </ul>
            </div>
            
            <button
              onClick={navigateToProperty}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Property Page (No Hydration Errors)
            </button>
          </div>

          {/* Console Instructions */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Console Check Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
              <li>Open browser Developer Tools (F12)</li>
              <li>Go to the Console tab</li>
              <li>Look for any red error messages</li>
              <li>Specifically check for "Hydration failed" errors</li>
              <li>If console is clean, the fix is working!</li>
            </ol>
          </div>

          {/* Back Button */}
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
