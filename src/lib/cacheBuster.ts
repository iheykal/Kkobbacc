/**
 * Cache Busting Utilities for Image URLs
 * 
 * Prevents stale image caching by adding version parameters
 */

/**
 * Adds a cache-busting parameter to a URL
 */
export function addCacheBuster(url: string, version?: string | number): string {
  if (!url) return url;
  
  const versionParam = version || Date.now();
  const separator = url.includes('?') ? '&' : '?';
  
  return `${url}${separator}v=${versionParam}`;
}

/**
 * Adds cache buster based on property update timestamp
 */
export function addPropertyCacheBuster(
  url: string, 
  property: { updatedAt?: Date | string; _id?: string; propertyId?: number }
): string {
  if (!url) return url;
  
  // Use updatedAt if available, otherwise fall back to _id or propertyId
  const version = property.updatedAt 
    ? new Date(property.updatedAt).getTime()
    : property._id || property.propertyId || Date.now();
  
  return addCacheBuster(url, version);
}

/**
 * Adds cache buster based on file upload timestamp
 */
export function addFileCacheBuster(url: string, uploadTimestamp?: number): string {
  if (!url) return url;
  
  const version = uploadTimestamp || Date.now();
  return addCacheBuster(url, version);
}

/**
 * Removes existing cache buster parameters
 */
export function removeCacheBuster(url: string): string {
  if (!url) return url;
  
  return url.replace(/[?&]v=\d+/g, '').replace(/[?&]$/, '');
}

/**
 * Extracts version from URL if present
 */
export function extractVersion(url: string): number | null {
  if (!url) return null;
  
  const match = url.match(/[?&]v=(\d+)/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Checks if URL has a cache buster
 */
export function hasCacheBuster(url: string): boolean {
  return extractVersion(url) !== null;
}

/**
 * Updates cache buster to current timestamp
 */
export function refreshCacheBuster(url: string): string {
  return addCacheBuster(removeCacheBuster(url));
}

/**
 * Batch process URLs with cache busters
 */
export function addCacheBustersToUrls(
  urls: string[], 
  version?: string | number
): string[] {
  return urls.map(url => addCacheBuster(url, version));
}

/**
 * Batch process property images with cache busters
 */
export function addPropertyCacheBustersToUrls(
  urls: string[],
  property: { updatedAt?: Date | string; _id?: string; propertyId?: number }
): string[] {
  return urls.map(url => addPropertyCacheBuster(url, property));
}




