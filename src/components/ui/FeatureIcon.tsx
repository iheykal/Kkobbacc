'use client'

import React from 'react'
import { getFeatureIcon, isTransparentFeature, getFeatureIconClasses } from '@/lib/featureIcons'

interface FeatureIconProps {
  featureName: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export const FeatureIcon: React.FC<FeatureIconProps> = ({ 
  featureName, 
  size = 'md', 
  showLabel = false,
  className = ''
}) => {
  const icon = getFeatureIcon(featureName)
  const isTransparent = isTransparentFeature(featureName)
  
  // Get consistent styling classes
  const baseClasses = getFeatureIconClasses(size)
  
  return (
    <div className={`relative ${className}`}>
      <img 
        src={icon.src} 
        alt={icon.alt} 
        className={baseClasses}
      />
      {showLabel && (
        <span className="text-sm text-gray-600 mt-1 block text-center">
          {featureName}
        </span>
      )}
      {/* No gradient background - keeping it transparent like shower and bed */}
    </div>
  )
}

export default FeatureIcon
