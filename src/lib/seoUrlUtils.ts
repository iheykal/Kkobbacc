/**
 * SEO URL utilities for generating property URLs
 * 
 * URL Format: /{propertyType}-{status}-ah/{city}/degmada-{district}/{propertyId}
 * Example: /apartment-kiro-ah/muqdisho/degmada-abdiaziz/203
 */

export interface PropertyUrlData {
  propertyType: string;
  status: string;
  listingType?: string;
  district: string;
  location?: string;
  propertyId?: string | number;
  _id?: string | number;
}

export interface SEOUrlResult {
  seoSlug: string;
  seoUrl: string;
  canonicalUrl: string;
}

/**
 * Sanitizes a string for use in URLs
 * Converts to lowercase, removes special characters, replaces spaces with hyphens
 */
function sanitizeSlug(str: string): string {
  if (!str) return 'unknown';
  
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Maps property status to Somali terms
 */
function getStatusSlug(status: string): string {
  if (!status) return 'kiro';
  
  const normalizedStatus = status.toLowerCase().trim();
  
  // Handle different status formats
  if (normalizedStatus.includes('rent') || normalizedStatus === 'kiro') {
    return 'kiro';
  } else if (normalizedStatus.includes('sale') || normalizedStatus === 'iib') {
    return 'iib';
  }
  
  return 'kiro'; // Default to rent
}

/**
 * Gets the property type slug from property type
 */
function getPropertyTypeSlug(propertyType: string): string {
  if (!propertyType) return 'property';
  
  const normalized = propertyType.toLowerCase().trim();
  
  // Common property type mappings
  const typeMap: Record<string, string> = {
    'apartment': 'apartment',
    'villa': 'villa',
    'house': 'house',
    'land': 'land',
    'commercial': 'commercial',
    'office': 'office',
    'shop': 'shop',
    'warehouse': 'warehouse',
  };
  
  return typeMap[normalized] || sanitizeSlug(propertyType);
}

/**
 * Gets the city slug (currently hardcoded to Mogadishu/Muqdisho)
 */
function getCitySlug(location?: string): string {
  // For now, all properties are in Mogadishu
  // This could be made dynamic based on location if needed
  return 'muqdisho';
}

/**
 * Generates an SEO-friendly URL from property data
 * 
 * @param property - Property data object
 * @returns SEO URL result with slug, URL, and canonical URL
 * 
 * @example
 * ```typescript
 * const url = generateSEOUrl({
 *   propertyType: 'Apartment',
 *   status: 'For Rent',
 *   district: 'Abdiaziz',
 *   propertyId: 203
 * });
 * // Returns: {
 * //   seoSlug: 'apartment-kiro-ah-muqdisho-degmada-abdiaziz-203',
 * //   seoUrl: '/apartment-kiro-ah/muqdisho/degmada-abdiaziz/203',
 * //   canonicalUrl: 'https://kobac.net/apartment-kiro-ah/muqdisho/degmada-abdiaziz/203'
 * // }
 * ```
 */
export function generateSEOUrl(property: PropertyUrlData): SEOUrlResult {
  const propertyType = getPropertyTypeSlug(property.propertyType);
  const status = getStatusSlug(property.status || property.listingType || '');
  const city = getCitySlug(property.location);
  const district = sanitizeSlug(property.district);
  const propertyId = property.propertyId || property._id || 'unknown';

  // Format: {propertyType}-{status}-ah/{city}/degmada-{district}/{propertyId}
  const seoSlug = `${propertyType}-${status}-ah-${city}-degmada-${district}-${propertyId}`;
  const seoUrl = `/${propertyType}-${status}-ah/${city}/degmada-${district}/${propertyId}`;
  
  // Get base URL from environment or use default
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://kobac-real-estate.onrender.com';
  
  const canonicalUrl = `${baseUrl}${seoUrl}`;

  return { seoSlug, seoUrl, canonicalUrl };
}

/**
 * Parses an SEO URL back into property identifiers
 * 
 * @param url - SEO URL string (e.g., '/apartment-kiro-ah/muqdisho/degmada-abdiaziz/203')
 * @returns Parsed URL data or null if invalid
 */
export function parseSEOUrl(url: string): {
  propertyType?: string;
  status?: string;
  city?: string;
  district?: string;
  propertyId?: string;
} | null {
  if (!url || !url.startsWith('/')) return null;

  // Remove leading slash and split
  const parts = url.slice(1).split('/');
  
  if (parts.length < 4) return null;

  try {
    // Parse: /{propertyType}-{status}-ah/{city}/degmada-{district}/{propertyId}
    const [propertyTypeStatus, city, districtPart, propertyId] = parts;
    
    // Extract property type and status from first part
    // Format: "apartment-kiro-ah"
    const statusMatch = propertyTypeStatus.match(/-(kiro|iib)-ah$/);
    if (!statusMatch) return null;
    
    const status = statusMatch[1];
    const propertyType = propertyTypeStatus.replace(`-${status}-ah`, '');
    
    // Extract district from "degmada-abdiaziz"
    const district = districtPart.replace(/^degmada-/, '');
    
    return {
      propertyType,
      status,
      city,
      district,
      propertyId
    };
  } catch (error) {
    console.error('Error parsing SEO URL:', error);
    return null;
  }
}

/**
 * Checks if a URL matches the SEO URL format
 */
export function isSEOUrl(url: string): boolean {
  if (!url) return false;
  
  // Pattern: /{propertyType}-{status}-ah/{city}/degmada-{district}/{propertyId}
  const seoUrlPattern = /^\/[a-z0-9-]+-(kiro|iib)-ah\/[a-z0-9-]+\/degmada-[a-z0-9-]+\/[0-9]+$/;
  return seoUrlPattern.test(url);
}

