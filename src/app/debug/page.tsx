'use client'

import { useState, useEffect } from 'react'
import { propertyEventManager } from '@/lib/propertyEvents'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<string[]>([])
  const [propertyAgentTest, setPropertyAgentTest] = useState<any>(null)
  const [propertyId, setPropertyId] = useState('')
  const [refreshStatus, setRefreshStatus] = useState<string>('')
  const [propertyCreationTest, setPropertyCreationTest] = useState<any>(null)
  const [testAgentId, setTestAgentId] = useState('')
  const [agentAvatarTest, setAgentAvatarTest] = useState<any>(null)
  const [avatarUpdateStatus, setAvatarUpdateStatus] = useState<string>('')
  const [avatarRegenerateStatus, setAvatarRegenerateStatus] = useState<string>('')
  const [titleTestResult, setTitleTestResult] = useState<any>(null)
  const [titleUpdateStatus, setTitleUpdateStatus] = useState<string>('')
  const [visibilityTestResult, setVisibilityTestResult] = useState<any>(null)

  const fetchDebugInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-properties')
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error('Error fetching debug info:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTestProperty = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-create-property', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Test property created:', data)
      fetchDebugInfo() // Refresh debug info
    } catch (error) {
      console.error('Error creating test property:', error)
    } finally {
      setLoading(false)
    }
  }

  const testEvent = async (eventType: string) => {
    try {
      const response = await fetch('/api/test-property-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType,
          propertyId: 'test-property-id'
        })
      })
      const data = await response.json()
      console.log(`Event ${eventType} test result:`, data)
      setEvents(prev => [...prev, `${new Date().toLocaleTimeString()}: ${eventType} event triggered`])
    } catch (error) {
      console.error('Error testing event:', error)
    }
  }

  const testPropertyAgent = async () => {
    if (!propertyId.trim()) {
      alert('Please enter a property ID')
      return
    }
    
    try {
      const response = await fetch(`/api/test-property-agent?propertyId=${propertyId.trim()}`)
      const data = await response.json()
      console.log('Property agent test result:', data)
      setPropertyAgentTest(data)
    } catch (error) {
      console.error('Error testing property agent:', error)
    }
  }

  const refreshPropertyAgents = async () => {
    if (!confirm('This will refresh all existing properties with current agent profile data. Continue?')) {
      return
    }
    
    try {
      setRefreshStatus('Refreshing...')
      const response = await fetch('/api/refresh-property-agents', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Property agent refresh result:', data)
      
      if (data.success) {
        setRefreshStatus(`✅ Refresh completed: ${data.data.updatedCount} properties updated`)
        // Refresh debug info to see updated data
        fetchDebugInfo()
      } else {
        setRefreshStatus(`❌ Refresh failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error refreshing property agents:', error)
      setRefreshStatus('❌ Refresh failed')
    }
  }

  const testPropertyCreation = async () => {
    if (!testAgentId.trim()) {
      alert('Please enter an agent ID to test')
      return
    }
    
    try {
      const response = await fetch(`/api/test-property-creation?agentId=${testAgentId.trim()}`)
      const data = await response.json()
      console.log('Property creation test result:', data)
      setPropertyCreationTest(data)
    } catch (error) {
      console.error('Error testing property creation:', error)
    }
  }

  const testAgentAvatars = async () => {
    try {
      const response = await fetch('/api/test-agent-avatars')
      const data = await response.json()
      console.log('Agent avatar test result:', data)
      setAgentAvatarTest(data)
    } catch (error) {
      console.error('Error testing agent avatars:', error)
    }
  }

  const updateAgentAvatars = async () => {
    if (!confirm('This will update all agents without avatars to have unique generated avatars. Continue?')) {
      return
    }
    
    try {
      setAvatarUpdateStatus('Updating...')
      const response = await fetch('/api/update-agent-avatars', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Agent avatar update result:', data)
      
      if (data.success) {
        setAvatarUpdateStatus(`✅ Update completed: ${data.data.updatedCount} agents updated`)
        // Refresh agent avatar test to see updated data
        testAgentAvatars()
      } else {
        setAvatarUpdateStatus(`❌ Update failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating agent avatars:', error)
      setAvatarUpdateStatus('❌ Update failed')
    }
  }

  const regenerateAgentAvatars = async () => {
    if (!confirm('This will regenerate ALL agent avatars with improved cropping parameters. Continue?')) {
      return
    }
    
    try {
      setAvatarRegenerateStatus('Regenerating...')
      const response = await fetch('/api/regenerate-agent-avatars', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Agent avatar regeneration result:', data)
      
      if (data.success) {
        setAvatarRegenerateStatus(`✅ Regeneration completed: ${data.data.updatedCount} agents updated`)
        // Refresh agent avatar test to see updated data
        testAgentAvatars()
      } else {
        setAvatarRegenerateStatus(`❌ Regeneration failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error regenerating agent avatars:', error)
      setAvatarRegenerateStatus('❌ Regeneration failed')
    }
  }

  const testTitleEnhancement = async () => {
    try {
      setTitleTestResult('Testing...')
      
      // Test data for title enhancement
      const testCases = [
        { title: 'Villa', listingType: 'rent', expected: 'Villa Kiro ah' },
        { title: 'Apartment', listingType: 'sale', expected: 'Apartment iib ah' },
        { title: 'House', listingType: 'rent', expected: 'House Kiro ah' },
        { title: 'Office', listingType: 'sale', expected: 'Office iib ah' }
      ]
      
      const results = testCases.map(testCase => {
        let enhancedTitle = testCase.title
        if (testCase.listingType === 'rent') {
          enhancedTitle = `${testCase.title} Kiro ah`
        } else if (testCase.listingType === 'sale') {
          enhancedTitle = `${testCase.title} iib ah`
        }
        
        return {
          ...testCase,
          result: enhancedTitle,
          passed: enhancedTitle === testCase.expected
        }
      })
      
      setTitleTestResult({
        success: true,
        testCases: results,
        summary: `${results.filter(r => r.passed).length}/${results.length} tests passed`
      })
      
    } catch (error) {
      console.error('Error testing title enhancement:', error)
      setTitleTestResult({ success: false, error: 'Test failed' })
    }
  }

  const updateExistingPropertyTitles = async () => {
    if (!confirm('This will update ALL existing properties to have Somali language title suffixes. Continue?')) {
      return
    }
    
    try {
      setTitleUpdateStatus('Updating...')
      const response = await fetch('/api/update-existing-property-titles', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Property title update result:', data)
      
      if (data.success) {
        setTitleUpdateStatus(`✅ Update completed: ${data.data.updatedCount} properties updated, ${data.data.skippedCount} skipped`)
        // Refresh debug info to see updated data
        fetchDebugInfo()
      } else {
        setTitleUpdateStatus(`❌ Update failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating property titles:', error)
      setTitleUpdateStatus('❌ Update failed')
    }
  }

  const testPropertyVisibility = async () => {
    try {
      setVisibilityTestResult('Testing...')
      const response = await fetch('/api/test-property-visibility', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Property visibility test result:', data)
      
      if (data.success) {
        setVisibilityTestResult({
          success: true,
          data: data.data
        })
      } else {
        setVisibilityTestResult({
          success: false,
          error: data.error
        })
      }
    } catch (error) {
      console.error('Error testing property visibility:', error)
      setVisibilityTestResult({ success: false, error: 'Test failed' })
    }
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Property Debug Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Debug Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Database Status</h2>
            <button
              onClick={fetchDebugInfo}
              disabled={loading}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Debug Info'}
            </button>
            
            {debugInfo && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Property Statistics:</h3>
                  <pre className="bg-gray-100 p-2 rounded text-sm">
                    {JSON.stringify(debugInfo.stats, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold">Recent Properties:</h3>
                  <pre className="bg-gray-100 p-2 rounded text-sm max-h-60 overflow-y-auto">
                    {JSON.stringify(debugInfo.properties, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Test Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            
            <div className="space-y-4">
                             <button
                 onClick={createTestProperty}
                 disabled={loading}
                 className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
               >
                 {loading ? 'Creating...' : 'Create Test Property'}
               </button>
               
                               <button
                  onClick={refreshPropertyAgents}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh All Property Agents'}
                </button>
                
                <button
                  onClick={testAgentAvatars}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Agent Avatars'}
                </button>
                
                <button
                  onClick={updateAgentAvatars}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Agent Avatars'}
                </button>
                
                                 <button
                   onClick={regenerateAgentAvatars}
                   disabled={loading}
                   className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                 >
                   {loading ? 'Regenerating...' : 'Regenerate All Agent Avatars'}
                 </button>
                 
                 <button
                   onClick={testTitleEnhancement}
                   disabled={loading}
                   className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                 >
                   Test Title Enhancement
                 </button>
                 
                                   <button
                    onClick={updateExistingPropertyTitles}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Update All Existing Property Titles
                  </button>
                  
                  <button
                    onClick={testPropertyVisibility}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    Test Property Visibility
                  </button>
                 
                 {refreshStatus && (
                   <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                     {refreshStatus}
                   </div>
                 )}
                 
                 {avatarUpdateStatus && (
                   <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                     {avatarUpdateStatus}
                   </div>
                 )}
                 
                 {avatarRegenerateStatus && (
                   <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                     {avatarRegenerateStatus}
                   </div>
                 )}
                 
                                   {titleUpdateStatus && (
                    <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                      {titleUpdateStatus}
                    </div>
                  )}
                  
                  {visibilityTestResult && (
                    <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                      <div className="font-semibold mb-2">Property Visibility Test Results:</div>
                      {typeof visibilityTestResult === 'string' ? (
                        <div>{visibilityTestResult}</div>
                      ) : visibilityTestResult.success ? (
                        <div className="space-y-2 text-xs">
                          <div><strong>Property Created:</strong> {visibilityTestResult.data.propertyCreated.title}</div>
                          <div><strong>Visibility Test:</strong> {visibilityTestResult.data.visibilityTest.ourPropertyFound ? '✅ Found' : '❌ Not Found'}</div>
                          <div><strong>Main Page Test:</strong> {visibilityTestResult.data.mainPageTest.ourPropertyInMainPage ? '✅ Found' : '❌ Not Found'}</div>
                          <div><strong>Total Visible:</strong> {visibilityTestResult.data.visibilityTest.totalVisible}</div>
                        </div>
                      ) : (
                        <div className="text-red-600">❌ {visibilityTestResult.error}</div>
                      )}
                    </div>
                  )}
                  
                  {titleTestResult && (
                    <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                      <div className="font-semibold mb-2">Title Enhancement Test Results:</div>
                      {typeof titleTestResult === 'string' ? (
                        <div>{titleTestResult}</div>
                      ) : titleTestResult.success ? (
                        <div>
                          <div className="mb-2">{titleTestResult.summary}</div>
                          <div className="space-y-1 text-xs">
                            {titleTestResult.testCases.map((test: any, index: number) => (
                              <div key={index} className={`${test.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {test.title} ({test.listingType}) → {test.result} {test.passed ? '✅' : '❌'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-red-600">❌ {titleTestResult.error}</div>
                      )}
                    </div>
                  )}
              
              <div>
                <h3 className="font-semibold mb-2">Test Events:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => testEvent('added')}
                    className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    Test Added
                  </button>
                  <button
                    onClick={() => testEvent('updated')}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Test Updated
                  </button>
                  <button
                    onClick={() => testEvent('deleted')}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Test Deleted
                  </button>
                  <button
                    onClick={() => testEvent('refresh')}
                    className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                  >
                    Test Refresh
                  </button>
                </div>
              </div>

                             <div>
                 <h3 className="font-semibold mb-2">Test Property Creation:</h3>
                 <div className="space-y-2">
                   <input
                     type="text"
                     placeholder="Enter Agent ID to test"
                     value={testAgentId}
                     onChange={(e) => setTestAgentId(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                   />
                   <button
                     onClick={testPropertyCreation}
                     className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                   >
                     Test Property Creation
                   </button>
                 </div>
                 
                 {propertyCreationTest && (
                   <div className="mt-3">
                     <h4 className="font-semibold text-sm mb-2">Property Creation Test Result:</h4>
                     <pre className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
                       {JSON.stringify(propertyCreationTest, null, 2)}
                     </pre>
                   </div>
                 )}
                 
                 {agentAvatarTest && (
                   <div className="mt-3">
                     <h4 className="font-semibold text-sm mb-2">Agent Avatar Test Result:</h4>
                     <div className="space-y-2">
                       <div className="bg-blue-50 p-2 rounded text-xs">
                         <strong>Avatar Statistics:</strong> {agentAvatarTest.data.avatarStats.agentsWithAvatars}/{agentAvatarTest.data.avatarStats.totalAgents} agents have avatars
                       </div>
                       <pre className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
                         {JSON.stringify(agentAvatarTest.data, null, 2)}
                       </pre>
                     </div>
                   </div>
                 )}
               </div>

               <div>
                 <h3 className="font-semibold mb-2">Test Property Agent Data:</h3>
                 <div className="space-y-2">
                   <input
                     type="text"
                     placeholder="Enter Property ID"
                     value={propertyId}
                     onChange={(e) => setPropertyId(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                   />
                   <button
                     onClick={testPropertyAgent}
                     className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                   >
                     Test Property Agent
                   </button>
                 </div>
                 
                 {propertyAgentTest && (
                   <div className="mt-3">
                     <h4 className="font-semibold text-sm mb-2">Property Agent Test Result:</h4>
                     <pre className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
                       {JSON.stringify(propertyAgentTest, null, 2)}
                     </pre>
                   </div>
                 )}
               </div>
              
              <div>
                <h3 className="font-semibold mb-2">Event Log:</h3>
                <div className="bg-gray-100 p-2 rounded max-h-40 overflow-y-auto text-sm">
                  {events.length === 0 ? (
                    <p className="text-gray-500">No events triggered yet</p>
                  ) : (
                    events.map((event, index) => (
                      <div key={index} className="text-gray-700">{event}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debug Instructions</h2>
          
                     <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
             <h3 className="font-semibold text-yellow-800 mb-2">🔄 Profile Picture Update System</h3>
             <p className="text-yellow-700 text-sm">
               <strong>New properties</strong> automatically show current agent profile pictures.<br/>
               <strong>Existing properties</strong> need to be refreshed to show updated profile pictures.<br/>
               Use "Refresh All Property Agents" to update all existing properties.
             </p>
           </div>
           
           <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
             <h3 className="font-semibold text-blue-800 mb-2">👤 Agent Avatar System</h3>
             <p className="text-blue-700 text-sm">
               <strong>Hybrid Avatar System:</strong> External URLs (DiceBear) use regular img tags, local images use Next.js Image optimization.<br/>
               <strong>Custom Avatars:</strong> Agents with custom profile pictures will use those instead.<br/>
               <strong>Fallback System:</strong> Agents without avatars get unique generated ones to avoid duplicates.<br/>
               <strong>Improved Cropping:</strong> Avatars now have better face visibility with optimized parameters.<br/>
               Use "Update Agent Avatars" to give unique avatars to agents without them.<br/>
               Use "Regenerate All Agent Avatars" to fix cropping issues for existing avatars.
             </p>
           </div>
           
           <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
             <h3 className="font-semibold text-green-800 mb-2">🎨 Avatar Quality Improvements</h3>
             <p className="text-green-700 text-sm">
               <strong>Better Face Visibility:</strong> Reduced aggressive cropping ensures agent faces are clearly visible.<br/>
               <strong>Optimized Parameters:</strong> Scale (80%), radius (50%), and positioning adjustments for better results.<br/>
               <strong>Professional Appearance:</strong> Avatars now look more polished and less cropped.
             </p>
           </div>
           
           <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
             <h3 className="font-semibold text-orange-800 mb-2">🏷️ Somali Language Title Enhancement</h3>
             <p className="text-orange-700 text-sm">
               <strong>Automatic Suffixes:</strong> Property titles automatically get Somali language suffixes based on listing type.<br/>
               <strong>Rent Properties:</strong> "Villa" becomes "Villa Kiro ah" (Villa for rent).<br/>
               <strong>Sale Properties:</strong> "Apartment" becomes "Apartment iib ah" (Apartment for sale).<br/>
               <strong>Smart Updates:</strong> When listing type changes, titles are automatically updated with correct suffixes.
             </p>
           </div>
                     <ol className="list-decimal list-inside space-y-2 text-sm">
             <li>Click "Refresh Debug Info" to see current database state</li>
             <li>Click "Create Test Property" to add a test property to the database</li>
             <li>Click "Refresh All Property Agents" to update existing properties with current agent profile data</li>
                           <li>Click "Test Agent Avatars" to check current agent avatar status</li>
              <li>Click "Update Agent Avatars" to give unique avatars to agents without them</li>
              <li>Click "Regenerate All Agent Avatars" to fix cropping issues for existing avatars</li>
              <li>Click "Test Title Enhancement" to verify Somali language title suffixes</li>
              <li>Click "Update All Existing Property Titles" to add Somali suffixes to all current properties</li>
              <li>Click "Test Property Visibility" to check why new properties are hidden</li>
              <li>Check the main page to see if the test property appears</li>
              <li>Use "Test Events" to verify the event system is working</li>
              <li>Use "Test Property Agent" to check agent data for a specific property</li>
              <li>Check browser console for detailed logs</li>
           </ol>
        </div>
      </div>
    </div>
  )
}
