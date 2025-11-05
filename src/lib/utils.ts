import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextRequest } from "next/server"
import { generateSEOUrl } from './seoUrlUtils'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPrice(price: number, listingType?: string): string {
  const formattedPrice = `$${price.toLocaleString()}`
  
  // Add "/Bishii" (monthly in Somali) for rent properties
  if (listingType === 'rent') {
    return `${formattedPrice}<span class="text-xs font-light text-gray-500 italic">/Bishii</span>`
  }
  
  return formattedPrice
}

// Format price for input field display (with dollar sign and commas)
export function formatPriceForInput(price: string | number): string {
  if (!price) return ''
  
  // Convert to string and remove any non-numeric characters except decimal point
  const numericValue = price.toString().replace(/[^\d.]/g, '')
  
  // If empty, return empty string
  if (!numericValue) return ''
  
  // Convert to number and format with commas
  const number = parseFloat(numericValue)
  if (isNaN(number)) return ''
  
  // Format with commas and add dollar sign
  return `$${number.toLocaleString()}`
}

// Parse price from formatted input (remove dollar sign and commas, return number)
export function parsePriceFromInput(formattedPrice: string): number {
  if (!formattedPrice) return 0
  
  // Remove dollar sign, commas, and any other non-numeric characters except decimal point
  const numericString = formattedPrice.replace(/[^\d.]/g, '')
  
  // Convert to number
  const number = parseFloat(numericString)
  
  // Return 0 if invalid
  return isNaN(number) ? 0 : number
}

// Handle price input change - format as user types
export function handlePriceInputChange(value: string, setValue: (value: string) => void): void {
  // Remove any non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, '')
  
  // If empty, set empty string
  if (!numericValue) {
    setValue('')
    return
  }
  
  // Convert to number
  const number = parseFloat(numericValue)
  
  // If invalid number, don't update
  if (isNaN(number)) return
  
  // Format with dollar sign and commas
  const formatted = `$${number.toLocaleString()}`
  setValue(formatted)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // If it starts with 252 (country code), remove it and add 0
  if (digits.startsWith('252') && digits.length >= 12) {
    return '0' + digits.substring(3)
  }
  
  // If it already starts with 0, return as is
  if (digits.startsWith('0')) {
    return digits
  }
  
  // If it's a 9-digit number, add 0 prefix
  if (digits.length === 9) {
    return '0' + digits
  }
  
  // For any other format, return the original
  return phone
}

export function formatListingDate(dateString: string | Date): string {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Get the company logo URL that will be automatically attached to agent property posts
 * This can be easily changed to use a different logo by modifying this function
 * 
 * Environment variables:
 * - ENABLE_COMPANY_LOGO: Set to 'false' to disable automatic logo attachment
 * - COMPANY_LOGO_URL: Custom logo URL (defaults to '/icons/kobac.webp')
 */
export function getCompanyLogoUrl(): string | null {
  // Check if company logo attachment is disabled
  if (process.env.ENABLE_COMPANY_LOGO === 'false') {
    return null;
  }
  
  // Use custom logo URL if provided, otherwise use the existing Kobac logo
  return process.env.COMPANY_LOGO_URL || '/icons/kobac.webp';
}

export function capitalizeName(name: string): string {
  if (!name) return '';
  
  // Special case: if the name is "Kobac Real", display it as "Kobac Real Estate"
  if (name.toLowerCase() === 'kobac real') {
    return 'Kobac Real Estate';
  }
  
  return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export const getAuthenticatedUser = async (request: NextRequest) => {
  try {
    const cookie = request.cookies.get('kobac_session')?.value;
    if (!cookie) {
      return null;
    }
    
    const session = JSON.parse(decodeURIComponent(cookie));
    if (!session?.userId) {
      return null;
    }
    
    // Import User model here to avoid circular dependencies
    const { default: User } = await import('@/models/User');
    const user = await User.findById(session.userId).select('_id fullName phone role status');
    
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
};

export const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Default avatar URL - centralized for consistency
export const DEFAULT_AVATAR_URL = '/icons/kobac.png'

// Agent avatar URL - for all agents except Kobac
export const AGENT_AVATAR_URL = '/icons/line.png'

// Function to get avatar for users - Kobac gets DiceBear, others get line.png
export const generateUniqueAvatar = (fullName: string, phone: string, style?: string) => {
  // Check if this is Kobac Real Estate (superadmin)
  const isKobac = fullName.toLowerCase().includes('kobac') || fullName.toLowerCase().includes('real estate');
  
  if (isKobac) {
    // Kobac gets the special DiceBear avatar
    const seed = `${fullName}-${phone}`.replace(/\s+/g, '').toLowerCase();
    
    const params = new URLSearchParams({
      seed: seed,
      backgroundColor: 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf',
      clothingColor: 'ff6b6b,4ecdc4,45b7d1,96ceb4,ffeaa7',
      accessories: 'round',
      clothing: 'shirtCrewNeck',
      eye: 'happy',
      eyebrow: 'default',
      facialHair: 'medium',
      hair: 'short',
      hairColor: 'black,brown,blonde',
      mouth: 'smile',
      skinColor: 'light,tan,dark',
      top: 'shortHairShortFlat'
    });
    
    return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
  }
  
  // All other agents get line.png
  return AGENT_AVATAR_URL;
}

// Function to get avatar for superadmin - Kobac gets DiceBear, others get line.png
export const generateSuperAdminAvatar = (phone: string, fullName?: string) => {
  // Check if this is Kobac Real Estate
  const isKobac = fullName && (fullName.toLowerCase().includes('kobac') || fullName.toLowerCase().includes('real estate'));
  
  if (isKobac) {
    // Kobac gets the special DiceBear avatar
    const seed = `superadmin-${phone}`.replace(/\s+/g, '').toLowerCase();
    
    const params = new URLSearchParams({
      seed: seed,
      backgroundColor: 'ffd700,ffed4e,fff59d', // Gold colors for superadmin
      clothingColor: '2c3e50,34495e,2c3e50', // Dark professional colors
      accessories: 'prescription01',
      clothing: 'shirtCrewNeck',
      eye: 'happy',
      eyebrow: 'default',
      facialHair: 'none',
      hair: 'shortHairShortFlat',
      hairColor: 'black,brown',
      mouth: 'smile',
      skinColor: 'light,tan',
      top: 'shortHairShortFlat'
    });
    
    return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
  }
  
  // All other superadmins get line.png
  return AGENT_AVATAR_URL;
}

// Property URL utilities
export function getPropertyUrl(property: any): string {
  // Use SEO-friendly URL format
  const seoUrl = generateSEOUrl({
    propertyType: property.propertyType || 'property',
    status: property.status || property.listingType || '',
    listingType: property.listingType,
    district: property.district || 'unknown',
    location: property.location,
    propertyId: property.propertyId || property._id,
    _id: property._id
  })
  
  return seoUrl.seoUrl
}

export function getPropertyShareText(property: any): string {
  return `Check out this ${property.propertyType} in ${property.district} - ${property.title}`
}

export function copyPropertyUrl(property: any): void {
  const url = `${window.location.origin}${getPropertyUrl(property)}`
  navigator.clipboard.writeText(url)
  alert('Property link copied to clipboard!')
};

// Robust Avatar Management System
// This ensures consistent profile pictures regardless of code changes

// Stable sample agent avatars - these won't change during development
const SAMPLE_AGENT_AVATARS = {
  'agent-1': '/icons/uze.png', // Sarah Johnson
  'agent-2': '/icons/uze.png', // Michael Rodriguez  
  'agent-3': '/icons/uze.png', // Elena Rodriguez
  'agent-4': '/icons/uze.png', // David Chen
  'agent-5': '/icons/uze.png', // Robert Wilson
  'agent-6': '/icons/uze.png', // Lisa Thompson
  'agent-7': '/icons/uze.png', // James Brown
  'agent-8': '/icons/uze.png', // Maria Garcia
  'agent-9': '/icons/uze.png', // John Smith
  'agent-10': '/icons/uze.png', // Emily Davis
  'agent-11': '/icons/uze.png', // Carlos Rodriguez
  'agent-12': '/icons/uze.png', // Jennifer Wilson
  'agent-13': '/icons/uze.png', // Thomas Anderson
  'agent-14': '/icons/uze.png', // Amanda Johnson
  'agent-15': '/icons/uze.png', // Kevin Martinez
  'agent-16': '/icons/uze.png', // Rachel Green
  'agent-17': '/icons/uze.png', // Daniel Lee
  'agent-18': '/icons/uze.png', // Michelle Brown
  'agent-19': '/icons/uze.png', // Christopher Davis
  'agent-20': '/icons/uze.png', // Jessica Taylor
  'agent-21': '/icons/uze.png', // Matthew Wilson
  'agent-22': '/icons/uze.png', // Nicole Anderson
  'agent-23': '/icons/uze.png', // Andrew Thompson
  'agent-24': '/icons/uze.png', // Stephanie Garcia
  'agent-25': '/icons/uze.png', // Ryan Martinez
  'agent-26': '/icons/uze.png', // Lauren Johnson
  'agent-27': '/icons/uze.png', // Brandon Lee
  'agent-28': '/icons/uze.png', // Ashley Brown
  'agent-29': '/icons/uze.png', // Justin Davis
  'agent-30': '/icons/uze.png', // Samantha Wilson
  'agent-31': '/icons/uze.png', // Tyler Anderson
  'agent-32': '/icons/uze.png', // Brittany Thompson
  'agent-33': '/icons/uze.png', // Jordan Garcia
  'agent-34': '/icons/uze.png', // Megan Martinez
  'agent-35': '/icons/uze.png', // Alex Johnson
  'agent-36': '/icons/uze.png', // Courtney Lee
  'agent-37': '/icons/uze.png', // Derek Brown
  'agent-38': '/icons/uze.png', // Kimberly Davis
  'agent-39': '/icons/uze.png', // Marcus Wilson
  'agent-40': '/icons/uze.png', // Tiffany Anderson
  'agent-41': '/icons/uze.png', // Corey Thompson
  'agent-42': '/icons/uze.png', // Danielle Garcia
  'agent-43': '/icons/uze.png', // Travis Martinez
  'agent-44': '/icons/uze.png', // Crystal Johnson
  'agent-45': '/icons/uze.png', // Sean Lee
  'agent-46': '/icons/uze.png', // Natasha Brown
  'agent-47': '/icons/uze.png', // Devin Davis
  'agent-48': '/icons/uze.png', // Monique Wilson
  'agent-49': '/icons/uze.png', // Jamal Anderson
  'agent-50': '/icons/uze.png', // Latoya Thompson
  'agent-51': '/icons/uze.png', // Tyrone Garcia
  'agent-52': '/icons/uze.png', // Shanice Martinez
  'agent-53': '/icons/uze.png', // Malik Johnson
  'agent-54': '/icons/uze.png', // Keisha Lee
  'agent-55': '/icons/uze.png', // Darnell Brown
  'agent-56': '/icons/uze.png', // Aisha Davis
  'agent-57': '/icons/uze.png', // Rashad Wilson
  'agent-58': '/icons/uze.png', // Ebony Anderson
  'agent-59': '/icons/uze.png', // Marquis Thompson
  'agent-60': '/icons/uze.png', // Imani Garcia
  'agent-61': '/icons/uze.png', // Xavier Martinez
  'agent-62': '/icons/uze.png', // Zaria Johnson
  'agent-63': '/icons/uze.png', // Kareem Lee
  'agent-64': '/icons/uze.png', // Nia Brown
  'agent-65': '/icons/uze.png', // Andre Davis
  'agent-66': '/icons/uze.png', // Maya Wilson
  'agent-67': '/icons/uze.png', // Terrell Anderson
  'agent-68': '/icons/uze.png', // Sierra Thompson
  'agent-69': '/icons/uze.png', // Darius Garcia
  'agent-70': '/icons/uze.png', // Amara Martinez
  'agent-71': '/icons/uze.png', // Malik Johnson
  'agent-72': '/icons/uze.png', // Zora Lee
  'agent-73': '/icons/uze.png', // Kofi Brown
  'agent-74': '/icons/uze.png', // Aaliyah Davis
  'agent-75': '/icons/uze.png', // Jamar Wilson
  'agent-76': '/icons/uze.png', // Destiny Anderson
  'agent-77': '/icons/uze.png', // DeAndre Thompson
  'agent-78': '/icons/uze.png', // Nevaeh Garcia
  'agent-79': '/icons/uze.png', // Zion Martinez
  'agent-80': '/icons/uze.png', // Genesis Johnson
  'agent-81': '/icons/uze.png', // King Lee
  'agent-82': '/icons/uze.png', // Harmony Brown
  'agent-83': '/icons/uze.png', // Legend Davis
  'agent-84': '/icons/uze.png', // Serenity Wilson
  'agent-85': '/icons/uze.png', // Phoenix Anderson
  'agent-86': '/icons/uze.png', // Nova Thompson
  'agent-87': '/icons/uze.png', // Atlas Garcia
  'agent-88': '/icons/uze.png', // Luna Martinez
  'agent-89': '/icons/uze.png', // Orion Johnson
  'agent-90': '/icons/uze.png', // Aurora Lee
  'agent-91': '/icons/uze.png', // River Brown
  'agent-92': '/icons/uze.png', // Willow Davis
  'agent-93': '/icons/uze.png', // Sage Wilson
  'agent-94': '/icons/uze.png', // Indigo Anderson
  'agent-95': '/icons/uze.png', // Ocean Thompson
  'agent-96': '/icons/uze.png', // Sky Garcia
  'agent-97': '/icons/uze.png', // Forest Martinez
  'agent-98': '/icons/uze.png', // Meadow Johnson
  'agent-99': '/icons/uze.png', // Canyon Lee
  'agent-100': '/icons/uze.png', // Ridge Brown
}

/**
 * Get a stable avatar URL for an agent
 * This ensures consistent profile pictures that don't change during development
 * 
 * @param agentId - The agent's ID or name
 * @param currentAvatar - The current avatar URL from database
 * @param isSampleData - Whether this is sample/demo data
 * @returns A stable avatar URL
 */
export function getStableAvatarUrl(agentId: string, currentAvatar?: string, isSampleData: boolean = false): string {
  // If it's real data from database and has a valid avatar, use it
  if (!isSampleData && currentAvatar && currentAvatar !== DEFAULT_AVATAR_URL) {
    return currentAvatar;
  }
  
  // For sample data or missing avatars, use stable local images
  if (isSampleData) {
    // Use a deterministic avatar based on agent ID
    const agentNumber = agentId.match(/\d+/)?.[0] || '1';
    const sampleKey = `agent-${agentNumber}`;
    return SAMPLE_AGENT_AVATARS[sampleKey as keyof typeof SAMPLE_AGENT_AVATARS] || DEFAULT_AVATAR_URL;
  }
  
  // For real agents without avatars, use default avatar
  if (!isSampleData && (!currentAvatar || currentAvatar === DEFAULT_AVATAR_URL)) {
    // Return default avatar - no more DiceBear API
    return DEFAULT_AVATAR_URL;
  }
  
  // For real agents without avatars, use default
  return DEFAULT_AVATAR_URL;
}

/**
 * Check if an avatar URL is stable (won't change during development)
 * @param avatarUrl - The avatar URL to check
 * @returns True if the URL is stable
 */
export function isStableAvatarUrl(avatarUrl: string): boolean {
  // Stable URLs are local files or our own hosted images
  return avatarUrl.startsWith('/') || 
         avatarUrl.includes('r2.dev') || 
         avatarUrl.includes('kobac') ||
         !avatarUrl.includes('unsplash.com');
}

/**
 * Sanitize avatar URL to ensure it's stable
 * @param avatarUrl - The avatar URL to sanitize
 * @returns A stable avatar URL
 */
export function sanitizeAvatarUrl(avatarUrl: string): string {
  // If it's already stable, return as is
  if (isStableAvatarUrl(avatarUrl)) {
    return avatarUrl;
  }
  
  // If it's an Unsplash URL or other unstable URL, replace with default
  return DEFAULT_AVATAR_URL;
}

export function generateAgentAvatar(agentId: string, email?: string, fullName?: string): string {
  // Check if this is Kobac Real Estate
  const isKobac = fullName && (fullName.toLowerCase().includes('kobac') || fullName.toLowerCase().includes('real estate'));
  
  if (isKobac) {
    // Kobac gets the special DiceBear avatar
    const seed = `agent-${agentId}`.replace(/\s+/g, '').toLowerCase();
    
    const params = new URLSearchParams({
      seed: seed,
      backgroundColor: 'e3f2fd,bbdefb,90caf9',
      clothingColor: '1976d2,1565c0,0d47a1',
      accessories: 'round',
      clothing: 'shirtCrewNeck',
      eye: 'happy',
      eyebrow: 'default',
      facialHair: 'medium',
      hair: 'short',
      hairColor: 'black,brown,blonde',
      mouth: 'smile',
      skinColor: 'light,tan,dark',
      top: 'shortHairShortFlat'
    });
    
    return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
  }
  
  // All other agents get line.png
  return AGENT_AVATAR_URL;
}
