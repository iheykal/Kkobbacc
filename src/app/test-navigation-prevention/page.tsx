'use client'


export const dynamic = 'force-dynamic';
import { useState } from 'react'

export default function TestNavigationPreventionPage() {
  const [testResults, setTestResults] = useState<any[]>([])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Navigation Prevention Test</h1>
          <p className="text-gray-600">Testing the comprehensive navigation prevention system</p>
        </div>
      </div>
    </div>
  )
}

