/**
 * Utility functions for handling property expiration dates
 */

export interface ExpirationInfo {
  expiresAt: Date;
  isExpired: boolean;
  daysUntilExpiry: number;
  daysExpired: number;
  expirationStatus: 'active' | 'expiring_soon' | 'expired';
}

/**
 * Calculate expiration date for a property based on listing type
 */
export function calculateExpirationDate(listingType: 'sale' | 'rent', createdAt?: Date): Date {
  const baseDate = createdAt || new Date();
  
  if (listingType === 'rent') {
    // 30 days for rentals
    return new Date(baseDate.getTime() + (30 * 24 * 60 * 60 * 1000));
  } else {
    // 90 days for sales
    return new Date(baseDate.getTime() + (90 * 24 * 60 * 60 * 1000));
  }
}

/**
 * Get expiration information for a property
 */
export function getExpirationInfo(expiresAt: Date | string, createdAt?: Date | string): ExpirationInfo {
  const expirationDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  
  const isExpired = now > expirationDate;
  const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysExpired = Math.floor((now.getTime() - expirationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let expirationStatus: 'active' | 'expiring_soon' | 'expired';
  if (isExpired) {
    expirationStatus = 'expired';
  } else if (daysUntilExpiry <= 7) {
    expirationStatus = 'expiring_soon';
  } else {
    expirationStatus = 'active';
  }
  
  return {
    expiresAt: expirationDate,
    isExpired,
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
    daysExpired: Math.max(0, daysExpired),
    expirationStatus
  };
}

/**
 * Format expiration date for display
 */
export function formatExpirationDate(expiresAt: Date | string): string {
  const date = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get expiration status message
 */
export function getExpirationStatusMessage(expirationInfo: ExpirationInfo): string {
  if (expirationInfo.isExpired) {
    return `Expired ${expirationInfo.daysExpired} day${expirationInfo.daysExpired !== 1 ? 's' : ''} ago`;
  } else if (expirationInfo.expirationStatus === 'expiring_soon') {
    return `Expires in ${expirationInfo.daysUntilExpiry} day${expirationInfo.daysUntilExpiry !== 1 ? 's' : ''}`;
  } else {
    return `Expires in ${expirationInfo.daysUntilExpiry} day${expirationInfo.daysUntilExpiry !== 1 ? 's' : ''}`;
  }
}

/**
 * Get expiration status color for UI
 */
export function getExpirationStatusColor(expirationInfo: ExpirationInfo): string {
  switch (expirationInfo.expirationStatus) {
    case 'expired':
      return 'text-red-600 bg-red-100';
    case 'expiring_soon':
      return 'text-orange-600 bg-orange-100';
    case 'active':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}
