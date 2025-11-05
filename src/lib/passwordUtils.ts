// Dynamic imports to reduce bundle size

// Common weak passwords to block
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever',
  'qazwsx', 'trustno1', '654321', 'jordan23', 'harley', 'password1',
  '1234', 'robert', 'matthew', 'jordan', 'asshole', 'daniel',
  'andrew', 'charles', 'michael', 'james', 'william', 'david',
  'joseph', 'thomas', 'christopher', 'daniel', 'paul', 'mark',
  'donald', 'george', 'kenneth', 'steven', 'edward', 'brian',
  'ronald', 'anthony', 'kevin', 'jason', 'matthew', 'gary',
  'timothy', 'jose', 'larry', 'jeffrey', 'frank', 'scott',
  'eric', 'stephen', 'andrew', 'raymond', 'gregory', 'joshua',
  'jerry', 'dennis', 'walter', 'patrick', 'peter', 'harold',
  'douglas', 'henry', 'carl', 'arthur', 'ryan', 'roger'
];

/**
 * Validates password strength and security requirements
 * @param password - The password to validate
 * @param phone - User's phone number (to prevent inclusion in password)
 * @param email - User's email (to prevent inclusion in password)
 * @returns null if valid, error message if invalid
 */
export async function validatePassword(password: string, phone?: string, email?: string): Promise<string | null> {
  if (!password) {
    return 'Password is required.';
  }

  // Minimum length check - changed from 12 to 5
  if (password.length < 5) {
    return 'Password must be at least 5 characters long.';
  }

  // Check if password contains at least one number OR one alphabet
  const hasNumber = /\d/.test(password);
  const hasAlphabet = /[a-zA-Z]/.test(password);
  
  if (!hasNumber && !hasAlphabet) {
    return 'Password must contain at least one number or one alphabet.';
  }

  // Allow numbers only, text only, or mixed passwords
  // No additional restrictions on password composition

  // Check against common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return 'Password is too common. Please choose a more unique password.';
  }

  // Check if password contains phone number
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length >= 6 && password.includes(phoneDigits.slice(-6))) {
      return 'Password cannot contain your phone number.';
    }
  }

  // Check if password contains email
  if (email) {
    const emailLocal = email.split('@')[0];
    if (emailLocal.length >= 4 && password.toLowerCase().includes(emailLocal.toLowerCase())) {
      return 'Password cannot contain your email address.';
    }
  }

  return null; // Password is valid
}

/**
 * Hashes a password using bcryptjs
 * @param password - The plain text password to hash
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const bcrypt = (await import('bcryptjs')).default;
    const saltRounds = 12; // Higher than default for better security
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verifies a password against its hash with migration support
 * @param hash - The stored password hash
 * @param password - The plain text password to verify
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    console.log('🔐 Password verification started');
    console.log('🔐 Hash length:', hash?.length);
    console.log('🔐 Password length:', password?.length);
    
    // First try bcryptjs (new system)
    const bcrypt = (await import('bcryptjs')).default;
    console.log('🔐 Bcryptjs imported successfully');
    
    const bcryptResult = await bcrypt.compare(password, hash);
    console.log('🔐 Bcryptjs verification result:', bcryptResult);
    
    if (bcryptResult) {
      return true;
    }
    
    // If bcryptjs fails, try argon2 (legacy system)
    console.log('🔐 Bcryptjs failed, trying argon2 for legacy support...');
    try {
      const argon2 = (await import('argon2')).default;
      const argon2Result = await argon2.verify(hash, password);
      console.log('🔐 Argon2 verification result:', argon2Result);
      
      if (argon2Result) {
        console.log('⚠️ Legacy argon2 hash detected - user should update password');
        return true;
      }
    } catch (argon2Error) {
      console.log('🔐 Argon2 not available or failed:', argon2Error);
    }
    
    console.log('🔐 Password verification failed with both methods');
    return false;
    
  } catch (error) {
    console.error('❌ Error verifying password:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * Generates a secure random token for password reset
 * @param length - Length of the token in bytes (default: 32)
 * @returns Promise<string> - The generated token
 */
export async function generateResetToken(length: number = 32): Promise<string> {
  const crypto = await import('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hashes a reset token for secure storage
 * @param token - The reset token to hash
 * @returns Promise<string> - The hashed token
 */
export async function hashResetToken(token: string): Promise<string> {
  try {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  } catch (error) {
    console.error('Error hashing reset token:', error);
    throw new Error('Failed to hash reset token');
  }
}

/**
 * Verifies a reset token against its hash
 * @param token - The plain text token to verify
 * @param hash - The stored token hash
 * @returns boolean - True if token matches, false otherwise
 */
export function verifyResetToken(token: string, hash: string): boolean {
  try {
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return tokenHash === hash;
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return false;
  }
}

/**
 * Normalizes phone number to consistent format
 * @param phone - The phone number to normalize
 * @returns string - Normalized phone number
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  console.log('🔍 Phone normalization - Input:', phone, 'Digits:', digits);
  
  // Handle different formats
  if (digits.startsWith('252')) {
    // Already has country code
    const result = '+' + digits;
    console.log('🔍 Phone normalization - Result (252):', result);
    return result;
  } else if (digits.startsWith('61') && digits.length === 9) {
    // Somali format without country code
    const result = '+252' + digits;
    console.log('🔍 Phone normalization - Result (61):', result);
    return result;
  } else if (digits.length === 9) {
    // Assume it's a Somali number (9 digits)
    const result = '+252' + digits;
    console.log('🔍 Phone normalization - Result (9 digits):', result);
    return result;
  } else if (digits.length === 12 && digits.startsWith('252')) {
    // 12 digits starting with 252 (without +)
    const result = '+' + digits;
    console.log('🔍 Phone normalization - Result (12 digits):', result);
    return result;
  } else {
    // Return as is if we can't determine format
    console.log('🔍 Phone normalization - Result (as is):', phone);
    return phone;
  }
}

/**
 * Validates phone number format
 * @param phone - The phone number to validate
 * @returns boolean - True if valid, false otherwise
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  console.log('🔍 Phone validation - Input:', phone, 'Digits:', digits, 'Length:', digits.length);
  
  // Check if it's 9 digits (without country code) or 12 digits (with +252)
  if (digits.length === 9) {
    console.log('✅ Phone validation - Valid 9 digits');
    return true;
  }
  
  // Check if it's 12 digits starting with 252 (normalized format)
  if (digits.length === 12 && digits.startsWith('252')) {
    console.log('✅ Phone validation - Valid 12 digits with country code');
    return true;
  }
  
  console.log('❌ Phone validation - Invalid format');
  return false;
}

/**
 * Generates a secure random password
 * @param length - Length of the password (default: 12)
 * @returns string - Generated password
 */
export async function generateSecurePassword(length: number = 12): Promise<string> {
  const crypto = await import('crypto');
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Checks if a password needs to be updated (for security policies)
 * @param hash - The current password hash
 * @param lastChanged - When the password was last changed
 * @returns boolean - True if password should be updated
 */
export function shouldUpdatePassword(lastChanged: Date): boolean {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  return lastChanged < sixMonthsAgo;
}

/**
 * Estimates password strength using zxcvbn
 * @param password - The password to analyze
 * @returns Promise<object> - Password strength analysis
 */
export async function analyzePasswordStrength(password: string): Promise<{
  score: number;
  feedback: string[];
  crackTime: string;
}> {
  try {
    const zxcvbn = (await import('zxcvbn')).default;
    const analysis = zxcvbn(password);
    
    return {
      score: analysis.score,
      feedback: analysis.feedback.suggestions,
      crackTime: String(analysis.crack_times_display.offline_slow_hashing_1e4_per_second)
    };
  } catch (error) {
    console.error('Error analyzing password strength:', error);
    return {
      score: 0,
      feedback: ['Unable to analyze password strength'],
      crackTime: 'Unknown'
    };
  }
}