/**
 * Safe image utilities that avoid conflicts with Next.js Image component
 */

/**
 * Safely create a new Image instance using the global constructor
 * This avoids conflicts with Next.js Image component imports
 */
export function createImageElement(): HTMLImageElement {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('createImageElement can only be called on the client side')
  }
  
  // Ensure we have access to the Image constructor
  if (typeof window.Image !== 'function') {
    throw new Error('Image constructor is not available')
  }
  
  // Use the global Image constructor directly from window
  return new window.Image()
}

/**
 * Preload an image URL
 * @param url - The image URL to preload
 * @returns Promise that resolves when the image is loaded
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = createImageElement()
    
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    
    img.src = url
  })
}

/**
 * Check if an image URL is valid by attempting to load it
 * @param url - The image URL to check
 * @returns Promise that resolves to true if the image loads successfully
 */
export function isValidImageUrl(url: string): Promise<boolean> {
  return preloadImage(url)
    .then(() => true)
    .catch(() => false)
}
