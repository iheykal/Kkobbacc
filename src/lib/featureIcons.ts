/**
 * Utility function to get the appropriate icon for property features and amenities
 * This ensures consistent icon usage across the application
 */

export interface FeatureIcon {
  src: string
  alt: string
  className?: string
}

/**
 * Maps feature names to their corresponding icon files
 * Handles special cases like deal -> deal-unscreen.gif for transparency
 */
export const getFeatureIcon = (featureName: string): FeatureIcon => {
  const normalizedFeature = featureName.toLowerCase().trim()
  
  // Special mappings for features that have specific icons
  const iconMap: Record<string, FeatureIcon> = {
    // Deal feature - use unscreen version for transparency
    'deal': {
      src: '/icons/deal-unscreen.gif',
      alt: 'Deal',
      className: 'h-16 w-16 mr-4 bg-transparent relative z-10'
    },
    
    // Shower feature - transparent version
    'shower': {
      src: '/icons/shower.png',
      alt: 'Shower',
      className: 'h-16 w-16 mr-4 bg-transparent relative z-10'
    },
    
    // Bed feature - transparent version
    'bed': {
      src: '/icons/bed.png',
      alt: 'Bed',
      className: 'h-16 w-16 mr-4 bg-transparent relative z-10'
    },
    
    // Ruler feature
    'ruler': {
      src: '/icons/ruler.gif',
      alt: 'Ruler',
      className: 'h-16 w-16 mr-4 bg-transparent relative z-10'
    },
    
    // Location feature
    'location': {
      src: '/icons/location.gif',
      alt: 'Location',
      className: 'h-16 w-16 mr-4 bg-transparent relative z-10'
    },
    
    // Contact feature
    'contact': {
      src: '/icons/contactgif.gif',
      alt: 'Contact',
      className: 'h-16 w-16 mr-4 bg-transparent relative z-10'
    },
    
    // Profile feature
    'profile': {
      src: '/icons/profile.gif',
      alt: 'Profile',
      className: 'h-16 w-16 mr-4 bg-transparent relative z-10'
    }
  }
  
  // Return the mapped icon or a default one
  return iconMap[normalizedFeature] || {
    src: '/icons/deal-unscreen.gif', // Default to deal-unscreen for unknown features
    alt: featureName,
    className: 'h-16 w-16 mr-4 bg-transparent relative z-10'
  }
}

/**
 * Gets the base CSS classes for feature icons
 * Ensures consistent styling across all feature icons
 */
export const getFeatureIconClasses = (size: 'sm' | 'md' | 'lg' = 'md'): string => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16'
  }
  
  return `${sizeClasses[size]} mr-4 bg-transparent relative z-10`
}

/**
 * Checks if a feature should use a transparent icon (no gradient background)
 */
export const isTransparentFeature = (featureName: string): boolean => {
  const transparentFeatures = ['deal', 'shower', 'bed', 'ruler', 'location', 'contact', 'profile']
  return transparentFeatures.includes(featureName.toLowerCase().trim())
}
