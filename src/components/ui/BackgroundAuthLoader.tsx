'use client'

import React from 'react'

interface BackgroundAuthLoaderProps {
  isLoading: boolean
}

export const BackgroundAuthLoader: React.FC<BackgroundAuthLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-blue-200">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-slate-600">Checking authentication...</span>
      </div>
    </div>
  )
}
