/**
 * Utility functions for name formatting and manipulation
 */

/**
 * Extracts the first name from a full name
 * @param fullName - The full name string
 * @returns The first name or 'Agent' if no name provided
 */
export function getFirstName(fullName?: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'Agent';
  }
  
  const trimmed = fullName.trim();
  if (!trimmed) {
    return 'Agent';
  }
  
  // Split by space and take the first part
  const firstPart = trimmed.split(' ')[0];
  return firstPart || 'Agent';
}

/**
 * Capitalizes the first letter of each word in a name
 * @param name - The name string
 * @returns Capitalized name
 */
export function capitalizeName(name?: string): string {
  if (!name || typeof name !== 'string') {
    return 'Agent';
  }
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a phone number for display
 * @param phone - The phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone?: string): string {
  if (!phone || typeof phone !== 'string') {
    return 'No contact';
  }
  
  // Clean the phone number
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 0) {
    return 'No contact';
  }
  
  // Format Somali phone numbers
  if (cleanPhone.startsWith('2526')) {
    // Format: +252 61 234 5678
    const formatted = `+252 61 ${cleanPhone.substring(5, 8)} ${cleanPhone.substring(8)}`;
    return formatted;
  } else if (cleanPhone.startsWith('252')) {
    // Format: +252 61 234 5678
    const formatted = `+252 61 ${cleanPhone.substring(5, 8)} ${cleanPhone.substring(8)}`;
    return formatted;
  } else if (cleanPhone.startsWith('61')) {
    // Format: 061 234 5678
    const formatted = `061 ${cleanPhone.substring(2, 5)} ${cleanPhone.substring(5)}`;
    return formatted;
  } else {
    // Default formatting
    return phone;
  }
}
