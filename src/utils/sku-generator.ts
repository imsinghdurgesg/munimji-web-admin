/**
 * Generate a unique SKU based on product name and timestamp
 * Format: PREFIX-YYYYMMDD-RANDOM
 * Example: PROD-20260308-A1B2
 */
export function generateSKU(productName?: string): string {
  // Get current date in YYYYMMDD format
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate random alphanumeric code (4 characters)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomCode = '';
  for (let i = 0; i < 4; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Extract prefix from product name if available
  let prefix = 'PROD';
  if (productName && productName.length > 0) {
    // Take first 3 letters of product name, uppercase, remove spaces
    const namePrefix = productName
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase();
    if (namePrefix.length >= 2) {
      prefix = namePrefix.padEnd(3, 'X');
    }
  }

  return `${prefix}-${dateStr}-${randomCode}`;
}

/**
 * Validate SKU format
 * Allows: letters, numbers, hyphens, underscores
 * Min length: 3, Max length: 50
 */
export function validateSKU(sku: string): boolean {
  if (!sku || sku.length < 3 || sku.length > 50) {
    return false;
  }
  // Allow alphanumeric, hyphens, and underscores
  return /^[A-Za-z0-9_-]+$/.test(sku);
}

/**
 * Format SKU to uppercase with proper separators
 */
export function formatSKU(sku: string): string {
  return sku.toUpperCase().trim();
}
