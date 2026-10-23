/**
 * Safe Date Formatting Utilities
 * 
 * Prevents runtime crashes when rendering dates from localStorage or API responses.
 * Handles Date objects, ISO strings, timestamps, null, undefined, and invalid values.
 */

/**
 * Safely convert any value to a Date object
 * Returns null if conversion fails
 */
export function safeDate(value: any): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Already a Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  
  // String (ISO format or other)
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  // Number (timestamp)
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
}

/**
 * Format date to locale string with fallback
 * @param value - Date, ISO string, timestamp, or null/undefined
 * @param fallback - Text to show if date is invalid (default: "Unavailable")
 */
export function formatDate(value: any, fallback: string = 'Unavailable'): string {
  const date = safeDate(value);
  if (!date) return fallback;
  
  try {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('[formatDate] Failed to format date:', error);
    return fallback;
  }
}

/**
 * Format date and time to locale string with fallback
 * @param value - Date, ISO string, timestamp, or null/undefined
 * @param fallback - Text to show if date is invalid (default: "Unavailable")
 */
export function formatDateTime(value: any, fallback: string = 'Unavailable'): string {
  const date = safeDate(value);
  if (!date) return fallback;
  
  try {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('[formatDateTime] Failed to format date:', error);
    return fallback;
  }
}

/**
 * Format time only to locale string with fallback
 * @param value - Date, ISO string, timestamp, or null/undefined
 * @param fallback - Text to show if date is invalid (default: "Unavailable")
 */
export function formatTime(value: any, fallback: string = 'Unavailable'): string {
  const date = safeDate(value);
  if (!date) return fallback;
  
  try {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('[formatTime] Failed to format date:', error);
    return fallback;
  }
}

/**
 * Format relative time (e.g., "2 minutes ago", "1 hour ago")
 * @param value - Date, ISO string, timestamp, or null/undefined
 * @param fallback - Text to show if date is invalid (default: "Never")
 */
export function formatRelativeTime(value: any, fallback: string = 'Never'): string {
  const date = safeDate(value);
  if (!date) return fallback;
  
  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    
    return formatDate(value);
  } catch (error) {
    console.warn('[formatRelativeTime] Failed to format date:', error);
    return fallback;
  }
}

/**
 * Hydrate dates in an object (convert ISO strings back to Date objects)
 * Useful after loading from localStorage
 * @param obj - Object with date fields
 * @param dateFields - Array of field names that should be Date objects
 */
export function hydrateDates<T extends Record<string, any>>(
  obj: T,
  dateFields: (keyof T)[]
): T {
  const hydrated = { ...obj };
  
  for (const field of dateFields) {
    const value = hydrated[field];
    if (value !== null && value !== undefined) {
      const date = safeDate(value);
      if (date) {
        (hydrated as any)[field] = date;
      }
    }
  }
  
  return hydrated;
}

/**
 * Hydrate dates in an array of objects
 * @param arr - Array of objects with date fields
 * @param dateFields - Array of field names that should be Date objects
 */
export function hydrateDatesArray<T extends Record<string, any>>(
  arr: T[],
  dateFields: (keyof T)[]
): T[] {
  return arr.map(item => hydrateDates(item, dateFields));
}
