'use client'


export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNavigation } from '@/contexts/NavigationContext'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function DebugNavigationFixPage() {
  const router = useRouter()
  const { goBack, showStateRestored, isReturningFromBack } = useNavigation()
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    const results = []

    // Test 1: Check if NavigationContext is working
    results.push({
      test: 'NavigationContext Available',
      status: typeof goBack === 'function' ? 'pass' : 'fail',
      message: typeof goBack === 'function' ? 'NavigationContext is properly loaded' : 'NavigationContext not found'
    })

    // Test 2: Check sessionStorage availability
    results.push({
      test: 'SessionStorage Available',
      status: typeof sessionStorage !== 'undefined' ? 'pass' : 'fail',
      message: typeof sessionStorage !== 'undefined' ? 'SessionStorage is available' : 'SessionStorage not available'
    })

    // Test 3: Check if state preservation works
    try {
      sessionStorage.setItem('test_key', 'test_value')
      const retrieved = sessionStorage.getItem('test_key')
      sessionStorage.removeItem('test_key')
      
      results.push({
        test: 'State Preservation',
        status: retrieved === 'test_value' ? 'pass' : 'fail',
        message: retrieved === 'test_value' ? 'State can be saved and retrieved' : 'State preservation failed'
      })
    } catch (error) {
      results.push({
        test: 'State Preservation',
        status: 'fail',
        message: `Error: ${error}`
      })
    }

    // Test 4: Check if back navigation flag is working
    results.push({
      test: 'Back Navigation Detection',
      status: typeof isReturningFromBack === 'boolean' ? 'pass' : 'fail',
      message: typeof isReturningFromBack === 'boolean' ? `Back navigation state: ${isReturningFromBack}` : 'Back navigation detection not working'
    })

    // Test 5: Check if History API is available
    results.push({
      test: 'History API Available',
      status: typeof history !== 'undefined' && typeof history.pushState === 'function' ? 'pass' : 'fail',
      message: typeof history !== 'undefined' && typeof history.pushState === 'function' ? 'History API is available' : 'History API not available'
    })

    setTestResults(results)
    setIsRunning(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const navigateToProperty = () => {
    // Navigate to a test property
    router.push('/iib/1') // Assuming property ID 1 exists
  }

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Navigation Fix Debug</h1>
            </div>
          </div>

          {/* Current State */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Current Navigation State</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Returning from Back:</span>
                <span className={`ml-2 px-2 py-1 rounded ${isReturningFromBack ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {isReturningFromBack ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">State Restored Indicator:</span>
                <span className={`ml-2 px-2 py-1 rounded ${showStateRestored ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {showStateRestored ? 'Showing' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">System Tests</h2>
              <button
                onClick={runTests}
                disabled={isRunning}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Run Tests'}
              </button>
            </div>

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

          {/* Navigation Test */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation Test</h2>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <h3 className="font-medium text-yellow-900 mb-2">How to Test Back Navigation Fix:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                <li>Click "Navigate to Property" below</li>
                <li>Scroll down on the property page</li>
                <li>Mark the property as favorite (click the heart)</li>
                <li>Click the "Back" button on the property page</li>
                <li>Return to this debug page</li>
                <li>Check if the page refreshed or maintained state</li>
              </ol>
            </div>
            
            <button
              onClick={navigateToProperty}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Navigate to Property (Test)
            </button>
          </div>

          {/* SessionStorage Debug */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SessionStorage Debug</h2>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="space-y-2 text-sm">
                {typeof window !== 'undefined' && (
                  <>
                    <div>
                      <span className="font-medium">Navigation Back Flag:</span>
                      <span className="ml-2 text-blue-600">
                        {sessionStorage.getItem('kobac_navigating_back') || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Previous Page:</span>
                      <span className="ml-2 text-blue-600">
                        {sessionStorage.getItem('kobac_previous_page') || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Stored States:</span>
                      <div className="ml-2 text-blue-600">
                        {Object.keys(sessionStorage)
                          .filter(key => key.startsWith('kobac_state_'))
                          .map(key => (
                            <div key={key} className="text-xs">
                              {key}: {sessionStorage.getItem(key)?.substring(0, 100)}...
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Fix Summary */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-2">Applied Fixes</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
              <li>✅ Added state restoration guard to prevent duplicate restoration</li>
              <li>✅ Changed router.replace() to router.push() to avoid page refresh</li>
              <li>✅ Removed isReturningFromBack dependency from main useEffect</li>
              <li>✅ Added conditional view count increment (only when not returning from back)</li>
              <li>✅ Separated state restoration into its own useEffect</li>
              <li>✅ Enhanced History API integration for better navigation state management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
