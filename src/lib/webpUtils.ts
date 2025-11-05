/**
 * WebP Utilities
 * Handles automatic WebP conversion and fallback serving
 */

export interface WebPImageOptions {
  src: string;
  alt: string;
  quality?: number;
  fallback?: string;
  className?: string;
  width?: number;
  height?: number;
}

export interface WebPConversionResult {
  success: boolean;
  webpPath?: string;
  originalPath: string;
  error?: string;
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Get WebP version of an image path
 */
export function getWebPPath(originalPath: string): string {
  if (!originalPath) return originalPath;
  
  const lastDotIndex = originalPath.lastIndexOf('.');
  if (lastDotIndex === -1) return originalPath;
  
  const pathWithoutExt = originalPath.substring(0, lastDotIndex);
  return `${pathWithoutExt}.webp`;
}

/**
 * Convert image to WebP using the API
 */
export async function convertToWebP(imagePath: string, quality: number = 85): Promise<WebPConversionResult> {
  try {
    const response = await fetch('/api/convert-webp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagePath,
        quality
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        webpPath: result.webpPath,
        originalPath: result.originalPath
      };
    } else {
      return {
        success: false,
        originalPath: imagePath,
        error: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      originalPath: imagePath,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get the best image source (WebP if supported, original otherwise)
 */
export function getBestImageSource(originalPath: string, webpPath?: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return original path
    return originalPath;
  }
  
  if (supportsWebP() && webpPath) {
    return webpPath;
  }
  
  return originalPath;
}

/**
 * Generate responsive image sources for WebP and fallbacks
 */
export function generateResponsiveSources(
  originalPath: string,
  webpPath?: string,
  sizes: string[] = ['320w', '640w', '1024w', '1280w']
): { srcSet: string; type: string }[] {
  const sources: { srcSet: string; type: string }[] = [];
  
  // WebP sources
  if (webpPath) {
    const webpSrcSet = sizes
      .map(size => {
        const sizeNum = parseInt(size.replace('w', ''));
        const webpPathWithSize = webpPath.replace(/\.webp$/, `_${sizeNum}.webp`);
        return `${webpPathWithSize} ${size}`;
      })
      .join(', ');
    
    sources.push({
      srcSet: webpSrcSet,
      type: 'image/webp'
    });
  }
  
  // Original format sources
  const originalSrcSet = sizes
    .map(size => {
      const sizeNum = parseInt(size.replace('w', ''));
      const originalPathWithSize = originalPath.replace(/\.[^.]+$/, `_${sizeNum}.${originalPath.split('.').pop()}`);
      return `${originalPathWithSize} ${size}`;
    })
    .join(', ');
  
  sources.push({
    srcSet: originalSrcSet,
    type: 'image/jpeg' // or detect from original path
  });
  
  return sources;
}

/**
 * Preload WebP images for better performance
 */
export function preloadWebPImages(imagePaths: string[]): void {
  if (typeof window === 'undefined') return;
  
  imagePaths.forEach(path => {
    const webpPath = getWebPPath(path);
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = webpPath;
    document.head.appendChild(link);
  });
}

/**
 * Batch convert images to WebP
 */
export async function batchConvertToWebP(
  imagePaths: string[],
  quality: number = 85
): Promise<WebPConversionResult[]> {
  const results: WebPConversionResult[] = [];
  
  // Process in batches to avoid overwhelming the server
  const batchSize = 5;
  for (let i = 0; i < imagePaths.length; i += batchSize) {
    const batch = imagePaths.slice(i, i + batchSize);
    const batchPromises = batch.map(path => convertToWebP(path, quality));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < imagePaths.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Get image optimization stats
 */
export function getOptimizationStats(results: WebPConversionResult[]): {
  totalFiles: number;
  successful: number;
  failed: number;
  totalSavings: number;
  averageSavings: number;
} {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  // This would need actual file size data from the conversion results
  // For now, return basic stats
  return {
    totalFiles: results.length,
    successful: successful.length,
    failed: failed.length,
    totalSavings: 0, // Would need actual size data
    averageSavings: 0 // Would need actual size data
  };
}

/**
 * WebP Image Component Props
 */
export interface WebPImageProps {
  src: string;
  alt: string;
  webpSrc?: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Generate WebP image component props
 */
export function generateWebPImageProps(
  originalSrc: string,
  options: Partial<WebPImageProps> = {}
): WebPImageProps {
  const webpSrc = getWebPPath(originalSrc);
  
  return {
    src: originalSrc,
    alt: options.alt || '',
    webpSrc,
    className: options.className,
    width: options.width,
    height: options.height,
    quality: options.quality || 85,
    loading: options.loading || 'lazy',
    onLoad: options.onLoad,
    onError: options.onError
  };
}

