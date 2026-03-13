/**
 * Environment Configuration
 * Centralized environment variable access
 */

export const env = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // Development mode
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Mode
  mode: import.meta.env.MODE,
};

// Log configuration in development
if (env.isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    apiUrl: env.apiUrl,
    mode: env.mode,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  });
}

// Validate required environment variables
if (!env.apiUrl) {
  console.error('❌ Missing API URL configuration. Please set VITE_API_BASE_URL environment variable.');
}
