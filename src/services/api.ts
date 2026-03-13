/**
 * API Service Layer
 * Handles all backend API calls with authentication
 */

import axios, { type AxiosError, type AxiosInstance } from 'axios';
import type {
  Category,
  DashboardStats,
  LoginRequest,
  LoginResponse,
  Product,
  ProductFormData,
  Shop,
} from '../types';
import { useAuthStore } from '../store/authStore';

// Create axios instance
const createApiClient = (): AxiosInstance => {
  let baseURL =
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Log the API URL being used (helps debug deployment issues)
  console.log('🌐 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    baseURL,
    mode: import.meta.env.MODE,
  });

  // Ensure baseURL ends with /api
  if (!baseURL.endsWith('/api')) {
    baseURL = `${baseURL}/api`;
  }

  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable cookies for cross-origin requests
  });

  // Cookies are sent automatically via withCredentials
  // No need for request interceptor - backend uses httpOnly cookies

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ error?: string; message?: string }>) => {
      // Handle 401 Unauthorized - token expired
      if (error.response?.status === 401) {
        // Try cookie-based refresh (httpOnly cookies sent automatically)
        try {
          await axios.post(
            `${baseURL}/auth/refresh`,
            {},
            { withCredentials: true } // Send httpOnly cookies with refresh request
          );

          // Refresh succeeded, new cookies set by backend
          // Retry the original request with new cookies
          if (error.config) {
            return axios({
              ...error.config,
              withCredentials: true,
            });
          }
        } catch (refreshError) {
          // Refresh failed - cookies expired or invalid
          useAuthStore.getState().clearTokens();
          window.dispatchEvent(new CustomEvent('auth:logout'));
          window.location.href = '/login';
        }
      }

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'An error occurred';

      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

const apiClient = createApiClient();

/**
 * Authentication API
 */
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      // Call backend logout to clear httpOnly cookies
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore errors on logout - still clear local state
      console.error('Logout request failed:', error);
    }
  },

  me: async (): Promise<any> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};

/**
 * Shop API
 */
export const shopApi = {
  getCurrent: async (): Promise<Shop> => {
    const shopId = getShopId();
    const { data } = await apiClient.get<Shop>(`/shops/${shopId}`);
    return data;
  },

  update: async (shopId: string, updates: Partial<Shop>): Promise<Shop> => {
    const { data } = await apiClient.patch<Shop>(`/shops/${shopId}`, updates);
    return data;
  },

  updateCatalogSettings: async (
    shopId: string,
    settings: {
      catalogEnabled?: boolean;
      catalogSlug?: string;
      whatsappNumber?: string;
      catalogTheme?: {
        primaryColor?: string;
        logo?: string;
      };
    }
  ): Promise<Shop> => {
    const { data } = await apiClient.patch<Shop>(`/shops/${shopId}/catalog/settings`, settings);
    return data;
  },

  uploadLogo: async (
    file: File
  ): Promise<{
    success: boolean;
    logo: {
      small: string;
      medium: string;
      large: string;
      original: string;
    };
    originalName: string;
    message: string;
  }> => {
    const shopId = getShopId();
    const formData = new FormData();
    formData.append('logo', file);

    const { data } = await apiClient.post(`/shops/${shopId}/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  deleteLogo: async (): Promise<{ success: boolean; message: string }> => {
    const shopId = getShopId();
    const { data } = await apiClient.delete(`/shops/${shopId}/logo`);
    return data;
  },
};

/**
 * Helper to get shopId from auth store (in-memory, not localStorage)
 */
const getShopId = (): string => {
  const shop = useAuthStore.getState().shop;
  if (shop?.id) {
    return shop.id;
  }
  throw new Error('Shop ID not found. Please login again.');
};

/**
 * Category API
 */
export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const shopId = getShopId();
    const { data } = await apiClient.get<Category[]>(`/shops/${shopId}/categories`);
    return data;
  },

  create: async (
    category: Omit<Category, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>
  ): Promise<Category> => {
    const shopId = getShopId();
    const { data } = await apiClient.post<Category>(`/shops/${shopId}/categories`, category);
    return data;
  },

  update: async (id: number, updates: Partial<Category>): Promise<Category> => {
    const shopId = getShopId();
    const { data } = await apiClient.patch<Category>(`/shops/${shopId}/categories/${id}`, updates);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    const shopId = getShopId();
    await apiClient.delete(`/shops/${shopId}/categories/${id}`);
  },
};

/**
 * Product API
 */
export const productApi = {
  getAll: async (): Promise<Product[]> => {
    const shopId = getShopId();
    const { data } = await apiClient.get<Product[]>(`/shops/${shopId}/products`);
    return data;
  },

  getById: async (id: number): Promise<Product> => {
    const shopId = getShopId();
    const { data } = await apiClient.get<Product>(`/shops/${shopId}/products/${id}`);
    return data;
  },

  create: async (product: ProductFormData): Promise<Product> => {
    const shopId = getShopId();
    const { data } = await apiClient.post<Product>(`/shops/${shopId}/products`, product);
    return data;
  },

  update: async (id: number, updates: Partial<ProductFormData>): Promise<Product> => {
    const shopId = getShopId();
    const { data } = await apiClient.patch<Product>(`/shops/${shopId}/products/${id}`, updates);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    const shopId = getShopId();
    await apiClient.delete(`/shops/${shopId}/products/${id}`);
  },

  uploadImage: async (
    file: File
  ): Promise<{
    success: boolean;
    images: {
      thumbnail: string;
      small: string;
      medium: string;
      large: string;
    };
    originalName: string;
    message: string;
  }> => {
    const shopId = getShopId();
    const formData = new FormData();
    formData.append('image', file);

    const { data } = await apiClient.post(`/shops/${shopId}/products/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

/**
 * Dashboard API
 */
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
    return data;
  },
};

export { apiClient };
