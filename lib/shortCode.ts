/**
 * Generate a random short code for URLs
 * Uses base62 encoding (0-9, a-z, A-Z) for URL-safe short codes
 */
export function generateShortCode(length: number = 6): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Validate custom alias
 * - Must be alphanumeric with hyphens/underscores
 * - 3-20 characters
 * - Cannot be reserved words
 */
export function validateCustomAlias(alias: string): { valid: boolean; error?: string } {
  const reservedWords = ['api', 'dashboard', 'auth', 'admin', 'login', 'logout', 'register', 'app', 'short']
  
  if (!alias || alias.length < 3) {
    return { valid: false, error: 'Alias must be at least 3 characters' }
  }
  
  if (alias.length > 20) {
    return { valid: false, error: 'Alias must be 20 characters or less' }
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
    return { valid: false, error: 'Alias can only contain letters, numbers, hyphens, and underscores' }
  }
  
  if (reservedWords.includes(alias.toLowerCase())) {
    return { valid: false, error: 'This alias is reserved' }
  }
  
  return { valid: true }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}
