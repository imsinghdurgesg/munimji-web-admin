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
          
          // Store tokens in memory only (not persisted to localStorage)
          get().setTokens(response.accessToken, response.refreshToken);

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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        shop: state.shop,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
