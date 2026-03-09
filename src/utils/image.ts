/**
 * Convert relative image URL to absolute URL with backend base
 * @param imageUrl - Relative or absolute image URL
 * @returns Absolute image URL
 */
export function getImageUrl(imageUrl?: string | null): string | undefined {
  if (!imageUrl) return undefined;

  // If already absolute URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Get API base URL and remove /api suffix
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const baseUrl = apiUrl.replace(/\/api$/, '');

  // Ensure imageUrl starts with /
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${baseUrl}${path}`;
}
