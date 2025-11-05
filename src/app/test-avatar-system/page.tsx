'use client'

import React from 'react'
import { getStableAvatarUrl, DEFAULT_AVATAR_URL, isStableAvatarUrl, sanitizeAvatarUrl } from '@/lib/utils'

export default function TestAvatarSystemPage() {
  const testCases = [
    {
      name: 'Sample Agent 1',
      agentId: 'agent-1',
      currentAvatar: undefined,
      isSampleData: true
    },
    {
      name: 'Sample Agent 2',
      agentId: 'agent-2',
      currentAvatar: undefined,
      isSampleData: true
    },
    {
      name: 'Real Agent with Custom Avatar',
      agentId: 'real-agent-123',
      currentAvatar: '/uploads/users/custom-avatar.jpg',
      isSampleData: false
    },
    {
      name: 'Real Agent without Avatar',
      agentId: 'real-agent-456',
      currentAvatar: undefined,
      isSampleData: false
    },
    {
      name: 'Agent with Unsplash URL',
      agentId: 'agent-3',
      currentAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
      isSampleData: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Avatar Management System Test</h1>
        
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Test Cases</h2>
          
          <div className="space-y-6">
            {testCases.map((testCase, index) => {
              const stableAvatar = getStableAvatarUrl(
                testCase.agentId, 
                testCase.currentAvatar, 
                testCase.isSampleData
              )
              
              const isStable = isStableAvatarUrl(testCase.currentAvatar || '')
              const sanitized = sanitizeAvatarUrl(testCase.currentAvatar || '')
              
              return (
                <div key={index} className="border border-slate-200 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">{testCase.name}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Agent ID: {testCase.agentId}</p>
                      <p className="text-sm text-slate-600 mb-1">Is Sample Data: {testCase.isSampleData ? 'Yes' : 'No'}</p>
                      <p className="text-sm text-slate-600 mb-1">Current Avatar: {testCase.currentAvatar || 'None'}</p>
                      <p className="text-sm text-slate-600 mb-1">Is Stable URL: {isStable ? 'Yes' : 'No'}</p>
                      <p className="text-sm text-slate-600 mb-1">Sanitized URL: {sanitized}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-2">Stable Avatar Result:</p>
                        <img
                          src={stableAvatar}
                          alt={testCase.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                        />
                        <p className="text-xs text-slate-600 mt-1 break-all">{stableAvatar}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">System Information</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Default Avatar URL</h3>
              <p className="text-sm text-slate-600">{DEFAULT_AVATAR_URL}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-slate-900 mb-2">How It Works</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Real agents with custom avatars keep their images</li>
                <li>• Sample agents use stable local images</li>
                <li>• Unsplash URLs are automatically replaced with defaults</li>
                <li>• All avatars are consistent and won't change during development</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

