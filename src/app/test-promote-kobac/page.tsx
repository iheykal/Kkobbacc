'use client';

import { useState } from 'react';

export default function TestPromoteKobac() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userId, setUserId] = useState('');
  const [newPassword, setNewPassword] = useState('8080kobac');

  const promoteToKobac = async () => {
    if (!userId.trim()) {
      setResult({ success: false, error: 'Please enter a User ID' });
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/promote-to-kobac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId.trim(),
          newPassword: newPassword.trim() || '8080kobac'
        })
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
          Promote User to Kobac SuperAdmin
        </h1>
        
        <div className="mb-6">
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-blue-800 mb-2">📋 Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>Find the User ID from your database</li>
              <li>Enter the User ID below</li>
              <li>Set the new password (default: 8080kobac)</li>
              <li>Click "Promote to Kobac"</li>
            </ol>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID (MongoDB ObjectId):
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g., 68bdbf0802eba5353c2eef66"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password:
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8080kobac"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={promoteToKobac}
            disabled={loading || !userId.trim()}
            className="mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Promoting...' : 'Promote to Kobac SuperAdmin'}
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
        
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-gray-800 mb-2">🔍 How to find User ID:</h3>
          <ol className="list-decimal list-inside text-gray-600 space-y-1">
            <li>Go to MongoDB Compass</li>
            <li>Open your database → users collection</li>
            <li>Find the user you want to promote</li>
            <li>Copy the _id field (e.g., 68bdbf0802eba5353c2eef66)</li>
            <li>Paste it in the User ID field above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
