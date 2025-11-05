'use client'

import React from 'react'
import { CheckCircle } from 'lucide-react'

interface StateRestoredIndicatorProps {
  show: boolean
}

export const StateRestoredIndicator: React.FC<StateRestoredIndicatorProps> = ({ show }) => {
  if (!show) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-500">
      <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">State Restored Successfully!</span>
      </div>
    </div>
  )
}
