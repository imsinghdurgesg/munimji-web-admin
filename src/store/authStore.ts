/**
 * Authentication Store
 * Manages user auth state with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Shop, LoginRequest } from '../types';
import { authApi, shopApi } from '../services/api';

interface AuthState {
  user: User | null;
  shop: Shop | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Internal token storage (NOT persisted to localStorage)
  _internalTokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };

  // Token getters and setters
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshShop: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      shop: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _internalTokens: { accessToken: null, refreshToken: null },

      // Token management methods (not persisted)
      getAccessToken: () => get()._internalTokens.accessToken,
      getRefreshToken: () => get()._internalTokens.refreshToken,
      
      setTokens: (accessToken: string, refreshToken: string) => {
        set({
          _internalTokens: { accessToken, refreshToken },
        });
      },
      
      clearTokens: () => {
        set({
          _internalTokens: { accessToken: null, refreshToken: null },
        });
      },

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);

          console.log('🔧 Login response received:', {
            hasUser: !!response.user,
            hasShop: !!response.shop,
            hasAccessToken: !!response.accessToken,
            hasRefreshToken: !!response.refreshToken,
          });

          // Don't store tokens - web admin uses httpOnly cookies for auth
          // Tokens are sent in response only for backward compatibility with electron app
          // Cookies are set by backend and sent automatically with requests

          // Check if cookies are set
          console.log('🔧 Cookies after login:', document.cookie);

          set({
            user: response.user,
            shop: response.shop,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          console.log('🔧 Login successful, isAuthenticated:', true);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          console.error('❌ Login failed:', errorMessage);
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        await authApi.logout();
        get().clearTokens();
        set({
          user: null,
          shop: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshShop: async () => {
        try {
          const shop = await shopApi.getCurrent();
          console.log('Fetched shop data:', shop);
          set({ shop });
        } catch (error) {
          console.error('Failed to refresh shop data:', error);
        }
      },

      clearError: () => set({ error: null }),

      initializeAuth: async () => {
        // Check if user is marked as authenticated
        const isAuth = get().isAuthenticated;

        console.log('🔧 initializeAuth called, isAuthenticated:', isAuth);

        if (!isAuth) {
          // Not authenticated, nothing to initialize
          console.log('🔧 Not authenticated, skipping initialization');
          return;
        }

        // User is authenticated, fetch user/shop data from API using cookies
        try {
          set({ isLoading: true });

          console.log('🔧 Fetching user and shop from /auth/me...');
          // Fetch current user and shop (cookies sent automatically)
          const response = await authApi.me();
          console.log('🔧 Response:', response);

          set({
            user: response.user,
            shop: response.shop,
            isAuthenticated: true,
            isLoading: false,
          });
          console.log('🔧 Auth initialization successful');
        } catch (error: any) {
          // Auth failed (cookies expired or invalid)
          console.error('❌ Auth initialization failed:', error);

          // Only clear auth if it's a 401 (unauthorized)
          // For other errors (network, etc.), keep user logged in with cached data
          if (error.response?.status === 401) {
            console.log('🔧 401 Unauthorized - clearing auth state');
            get().clearTokens();
            set({
              user: null,
              shop: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            // Network error or other issue - keep cached data
            console.log('🔧 Non-401 error - keeping cached auth data');
            set({ isLoading: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Persist auth state for faster page loads
        // Data will be refreshed from API if stale
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        shop: state.shop,
      }),
    }
  )
);
