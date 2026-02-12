import { create } from 'zustand';
import type { ProductFull, DashboardStats, Category, Tag } from '../types/database';

interface AppState {
  // Data
  products: ProductFull[];
  categories: Category[];
  tags: Tag[];
  stats: DashboardStats | null;

  // UI State
  loading: boolean;
  error: string | null;
  selectedProducts: Set<number>;

  // Actions
  setProducts: (products: ProductFull[]) => void;
  setCategories: (categories: Category[]) => void;
  setTags: (tags: Tag[]) => void;
  setStats: (stats: DashboardStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleProductSelection: (id: number) => void;
  clearSelection: () => void;
  selectAll: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  products: [],
  categories: [],
  tags: [],
  stats: null,
  loading: false,
  error: null,
  selectedProducts: new Set(),

  // Actions
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setTags: (tags) => set({ tags }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  toggleProductSelection: (id) => set((state) => {
    const newSelection = new Set(state.selectedProducts);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    return { selectedProducts: newSelection };
  }),

  clearSelection: () => set({ selectedProducts: new Set() }),

  selectAll: () => set((state) => ({
    selectedProducts: new Set(state.products.map(p => p.odoo_id))
  })),
}));
