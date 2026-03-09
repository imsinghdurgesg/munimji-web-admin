/**
 * Product Store
 * Manages product and category state
 */

import { create } from 'zustand';
import type { Product, Category, ProductFormData } from '../types';
import { productApi, categoryApi } from '../services/api';

interface CategoryFormData {
  name: string;
  description?: string;
}

interface ProductState {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  createProduct: (data: ProductFormData) => Promise<Product>;
  updateProduct: (id: number, data: ProductFormData) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  createCategory: (data: CategoryFormData) => Promise<Category>;
  clearError: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await productApi.getAll();
      set({ products, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await categoryApi.getAll();
      set({ categories });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
      set({ error: errorMessage });
    }
  },

  createProduct: async (data: ProductFormData) => {
    set({ isLoading: true, error: null });
    try {
      const product = await productApi.create(data);
      set((state) => ({
        products: [...state.products, product],
        isLoading: false,
      }));
      return product;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateProduct: async (id: number, data: ProductFormData) => {
    set({ isLoading: true, error: null });
    try {
      const product = await productApi.update(id, data);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? product : p)),
        isLoading: false,
      }));
      return product;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteProduct: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await productApi.delete(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createCategory: async (data: CategoryFormData) => {
    try {
      const category = await categoryApi.create(data);
      set((state) => ({
        categories: [...state.categories, category],
      }));
      return category;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
      set({ error: errorMessage });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
