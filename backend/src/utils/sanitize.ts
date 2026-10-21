/**
 * Sanitizes text to prevent Cross-Site Scripting (XSS)
 * Replaces HTML special characters with their corresponding entities
 */
export function sanitizeText(input?: string | null): string | undefined {
  if (!input) return undefined;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
