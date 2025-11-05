'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'

export default function AgentDebugPage() {
  const [user, setUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...')
      const res = await fetch('/api/auth/me')
      const result = await res.json()
      console.log('Auth response:', result)
      
      if (res.ok && result.user) {
        console.log('User authenticated:', result.user)
        setUser(result.user)
        if (result.user.role === 'agent' || result.user.role === 'agency') {
          console.log('Fetching properties for user:', result.user.id)
          fetchAgentProperties(result.user.id)
        } else {
          setError(`User role not allowed: ${result.user.role}`)
          setLoading(false)
        }
      } else {
        setError(`Authentication failed: ${result.error}`)
        setLoading(false)
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError(`Auth error: ${error}`)
      setLoading(false)
    }
  }

  const fetchAgentProperties = async (agentId: string) => {
    try {
      console.log('Fetching properties for agent:', agentId)
      const response = await fetch(`/api/properties?agentId=${agentId}`)
      const result = await response.json()
      console.log('API response:', result)
      if (response.ok) {
        setProperties(result.data || [])
      } else {
        setError(`Failed to fetch properties: ${result.error}`)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      setError(`Error fetching properties: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestProperty = async () => {
    if (!user) return
    
    try {
      const testProperty = {
        title: 'Test Property',
        description: 'This is a test property',
        price: '250000',
        location: 'Test Location',
        bedrooms: '3',
        bathrooms: '2',
        area: '1500',
        images: ['https://via.placeholder.com/400x300?text=Test+Property'],
        agentName: user.fullName || 'Test Agent',
        agentPhone: user.phone || ''
      }

      console.log('Creating test property:', testProperty)
      
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testProperty)
      })

      const result = await response.json()
      console.log('Create property response:', result)
      
      if (response.ok) {
        alert('Test property created successfully!')
        fetchAgentProperties(user.id)
      } else {
        alert(`Failed to create property: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating test property:', error)
      alert(`Error creating test property: ${error}`)
    }
  }

  const testR2Connection = async () => {
    try {
      console.log('🧪 Testing R2 connection...');
      
      const response = await fetch('/api/r2/test');
      const result = await response.json();
      
      console.log('R2 test response:', result);
      
      if (response.ok && result.success) {
        alert(`R2 connection successful!\nBucket: ${result.bucket}\nObjects: ${result.objectCount}`);
      } else {
        alert(`R2 connection failed: ${result.error}\n\nEnvironment check: ${JSON.stringify(result.envCheck, null, 2)}`);
      }
    } catch (error) {
      console.error('Error testing R2 connection:', error);
      alert(`Error testing R2 connection: ${error}`);
    }
  }

  const testR2Images = async () => {
    try {
      console.log('🧪 Testing R2 image accessibility...');
      
      const response = await fetch('/api/r2/test-images');
      const result = await response.json();
      
      console.log('R2 image test response:', result);
      
      if (response.ok && result.success) {
        const message = `R2 Images Test Results:\n\n` +
          `Bucket: ${result.bucket}\n` +
          `Public Base: ${result.publicBase}\n` +
          `Total Objects: ${result.totalObjects}\n\n` +
          `Accessibility Tests:\n${result.accessibilityTests.map((test: any) => 
            `${test.image}: ${test.accessible ? '✅ Accessible' : '❌ Not Accessible'} (${test.status || test.error})`
          ).join('\n')}\n\n` +
          `Sample URL: ${result.samplePublicUrl || 'No images found'}`;
        
        alert(message);
      } else {
        alert(`R2 image test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error testing R2 images:', error);
      alert(`Error testing R2 images: ${error}`);
    }
  }

  const testFileUpload = async () => {
    try {
      // Create a simple test file
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('testFile', testFile);
      formData.append('testField', 'test value');
      
      console.log('Testing file upload...');
      
      const response = await fetch('/api/test-upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log('Test upload response:', result);
      
      if (response.ok) {
        alert(`File upload test successful! Uploaded: ${result.uploadedFiles.join(', ')}`);
      } else {
        alert(`File upload test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error testing file upload:', error);
      alert(`Error testing file upload: ${error}`);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Agent Debug Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {user && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
          <h2 className="font-bold">User Info:</h2>
          <p>ID: {user.id}</p>
          <p>Name: {user.fullName}</p>
          <p>Role: {user.role}</p>
          <p>Email: {user.email || 'N/A'}</p>
        </div>
      )}
      
      <div className="mb-6">
        <button
          onClick={createTestProperty}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-4"
        >
          Create Test Property
        </button>
        
            <button
      onClick={testR2Connection}
      className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mr-4"
    >
      Test R2 Connection
    </button>
    
    <button
      onClick={testR2Images}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
    >
      Test R2 Images
    </button>
        
        <button
          onClick={testFileUpload}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test File Upload
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Properties ({properties.length})</h2>
        {properties.length === 0 ? (
          <p className="text-gray-500">No properties found</p>
        ) : (
          <div className="space-y-4">
            {properties.map((property, index) => (
              <div key={property._id || index} className="border p-4 rounded">
                <h3 className="font-bold">{property.title}</h3>
                <p>{property.description}</p>
                <p>Price: <span dangerouslySetInnerHTML={{ __html: formatPrice(property.price, property.listingType) }} /></p>
                <p>Location: {property.location}</p>
                <p>Beds: {property.beds}, Baths: {property.baths}</p>
                <p>Agent ID: {property.agentId}</p>
                <pre className="text-xs bg-gray-100 p-2 mt-2 overflow-auto">
                  {JSON.stringify(property, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <p>Check the browser console for detailed logs</p>
        <p>User ID: {user?.id || 'Not authenticated'}</p>
        <p>Properties count: {properties.length}</p>
      </div>
    </div>
  )
}
