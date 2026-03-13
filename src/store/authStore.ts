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

          // Don't store tokens - web admin uses httpOnly cookies for auth
          // Tokens are sent in response only for backward compatibility with electron app
          // Cookies are set by backend and sent automatically with requests

          set({
            user: response.user,
            shop: response.shop,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
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

        if (!isAuth) {
          // Not authenticated, nothing to initialize
          return;
        }

        // User is authenticated, fetch user/shop data from API using cookies
        try {
          set({ isLoading: true });

          // Fetch current user (cookies sent automatically)
          const user = await authApi.me();

          // Fetch shop data
          const shop = await shopApi.getCurrent();

          set({
            user,
            shop,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Auth failed (cookies expired or invalid)
          console.error('Auth initialization failed:', error);

          // Clear auth state
          get().clearTokens();
          set({
            user: null,
            shop: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist isAuthenticated flag (no sensitive data)
        // User and shop are fetched from API on mount using httpOnly cookies
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
