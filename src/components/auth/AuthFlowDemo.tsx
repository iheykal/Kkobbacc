'use client'

import React from 'react'

export const AuthFlowDemo: React.FC = () => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔐 Improved Authentication Flow
      </h3>
      
      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
          <span>User clicks <strong>"Account"</strong> button</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
          <span>Dropdown menu opens with two clear options:</span>
        </div>
        
        <div className="ml-8 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
            <span><strong>"Sign In"</strong> → Opens login form directly</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
            <span><strong>"Create Account"</strong> → Opens signup form directly</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
          <span>No more extra clicks! Direct access to the right form.</span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
        <p className="text-sm text-green-800">
          <strong>✅ Fixed:</strong> User flow is now intuitive and direct. 
          Click "Account" → Choose action → Form opens immediately!
        </p>
      </div>
    </div>
  )
}
