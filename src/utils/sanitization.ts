import DOMPurify from 'dompurify';
import { z } from 'zod';

/**
 * Sanitization utilities for user-generated content
 * Protects against XSS attacks and ensures data integrity
 */

// Configure DOMPurify with safe defaults
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Untrusted HTML content
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, purifyConfig);
}

/**
 * Sanitize plain text content
 * Removes all HTML tags and dangerous characters
 * @param text - Untrusted text content
 * @returns Safe plain text
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize URLs to prevent javascript: and data: protocol attacks
 * @param url - Untrusted URL
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http, https, and mailto protocols
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return DOMPurify.sanitize(url, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Validation schemas for user input
 */
export const messageSchema = z.object({
  content: z.string().min(1).max(500),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isPublic: z.boolean(),
  mediaUrl: z.string().url().optional(),
  messageType: z.enum(['text', 'event', 'story', 'livestream']).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(500),
  messageId: z.string().uuid(),
});

export const profileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
});

/**
 * Sanitize and validate message input
 */
export function sanitizeMessage(input: unknown) {
  const validated = messageSchema.parse(input);
  return {
    ...validated,
    content: sanitizeHTML(validated.content),
    mediaUrl: validated.mediaUrl ? sanitizeURL(validated.mediaUrl) : undefined,
  };
}

/**
 * Sanitize and validate comment input
 */
export function sanitizeComment(input: unknown) {
  const validated = commentSchema.parse(input);
  return {
    ...validated,
    content: sanitizeHTML(validated.content),
  };
}

/**
 * Sanitize and validate profile input
 */
export function sanitizeProfile(input: unknown) {
  const validated = profileSchema.parse(input);
  return {
    ...validated,
    bio: validated.bio ? sanitizeHTML(validated.bio) : undefined,
    avatarUrl: validated.avatarUrl ? sanitizeURL(validated.avatarUrl) : undefined,
  };
}

/**
 * Hook for sanitizing content in React components
 */
export function useSanitizedContent(content: string): string {
  return sanitizeHTML(content);
}
