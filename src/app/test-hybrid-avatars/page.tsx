'use client'

import React from 'react'
import HybridImage from '@/components/ui/HybridImage'
import { generateUniqueAvatar, generateAgentAvatar, DEFAULT_AVATAR_URL } from '@/lib/utils'

export default function TestHybridAvatars() {
  const testAvatars = [
    {
      name: 'Local Default Avatar',
      src: DEFAULT_AVATAR_URL,
      description: 'Local image - should use Next.js Image optimization'
    },
    {
      name: 'DiceBear User Avatar',
      src: generateUniqueAvatar('John Doe', '1234567890'),
      description: 'External DiceBear URL - should use regular img tag'
    },
    {
      name: 'DiceBear Agent Avatar',
      src: generateAgentAvatar('agent-123', 'test@example.com', 'John Agent'),
      description: 'External DiceBear URL - should use regular img tag'
    },
    {
      name: 'R2 Cloud Image',
      src: 'https://pub-36a660b428c343399354263f0c318585.r2.dev/agents/test/image.webp',
      description: 'External R2 URL - should use regular img tag'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Hybrid Image Component Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">How it works:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>Local URLs</strong> (starting with /) → Use Next.js Image component for optimization</li>
            <li><strong>External URLs</strong> (http/https) → Use regular img tag to avoid Next.js validation</li>
            <li><strong>DiceBear URLs</strong> → Use regular img tag to prevent 400 errors</li>
            <li><strong>Fallback</strong> → All images fall back to default avatar on error</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testAvatars.map((avatar, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-2">{avatar.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{avatar.description}</p>
              
              <div className="flex items-center space-x-4">
                <HybridImage
                  src={avatar.src}
                  alt={avatar.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                
                <div className="flex-1">
                  <p className="text-xs text-gray-500 break-all">
                    <strong>URL:</strong> {avatar.src}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Type:</strong> {avatar.src.startsWith('http') ? 'External (img tag)' : 'Local (Next.js Image)'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Benefits of Hybrid Approach:</h3>
          <ul className="list-disc list-inside space-y-1 text-green-700">
            <li>No more 400 errors from DiceBear API</li>
            <li>Local images still get Next.js optimization</li>
            <li>External images load without validation issues</li>
            <li>Consistent fallback behavior</li>
            <li>Best of both worlds: performance + reliability</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
