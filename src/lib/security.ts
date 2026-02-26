// Security utilities for input validation and sanitization

/**
 * Sanitize string input to prevent XSS attacks
 * Removes potentially dangerous HTML/script tags
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized.trim();
}

/**
 * Validate and sanitize URL
 * Only allows http, https, and mailto protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim();
  
  // Check if URL starts with allowed protocols
  const allowedProtocols = ['http://', 'https://', 'mailto:', '/'];
  const isAllowed = allowedProtocols.some(protocol => 
    trimmed.toLowerCase().startsWith(protocol)
  );
  
  if (!isAllowed && !trimmed.startsWith('/')) {
    return '';
  }
  
  // Remove javascript: and data: protocols
  if (trimmed.toLowerCase().includes('javascript:') || 
      trimmed.toLowerCase().includes('data:')) {
    return '';
  }
  
  return trimmed;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indonesian format)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  
  // Indonesian phone: starts with 0 or +62, 10-13 digits
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Sanitize HTML content while preserving safe formatting
 * Allows basic formatting tags but removes dangerous ones
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Allowed tags for basic formatting
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'];
  
  let sanitized = html;
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
}

/**
 * Validate file upload
 * Check file type and size
 */
export function validateFile(file: File, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
} = {}): { valid: boolean; error?: string } {
  const { maxSize = 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options;
  
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipe file tidak diizinkan. Hanya ${allowedTypes.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Generate safe filename
 * Remove special characters and spaces
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  
  // Get file extension
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot > 0 ? filename.substring(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.substring(lastDot) : '';
  
  // Remove special characters, keep only alphanumeric, dash, and underscore
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50); // Limit length
  
  return safeName + ext.toLowerCase();
}

/**
 * Rate limiting helper (client-side)
 * Prevents rapid form submissions
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  canAttempt(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
