'use client';

import { useState } from 'react';

export default function TestCreateKobac() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createNewKobac = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/create-new-kobac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Create New Kobac User
        </h1>
        
        <div className="mb-6">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ Important Steps:</h3>
            <ol className="list-decimal list-inside text-yellow-700 space-y-1">
              <li>First delete the old Kobac user from MongoDB</li>
              <li>Then click the button below to create a new one</li>
            </ol>
          </div>
          
          <p className="text-gray-600 mb-4">
            This will create a fresh Kobac user with:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
            <li><strong>Name:</strong> Kobac Real Estate</li>
            <li><strong>Phone:</strong> +252610251014</li>
            <li><strong>Password:</strong> 8080kobac (plain text)</li>
            <li><strong>Role:</strong> SuperAdmin</li>
          </ul>
          
          <button
            onClick={createNewKobac}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Creating...' : 'Create New Kobac User'}
          </button>
        </div>
        
        {result && (
          <div className={`p-4 rounded-lg ${
            result.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
          }`}>
            <h3 className={`font-bold ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ Success!' : '❌ Error'}
            </h3>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
