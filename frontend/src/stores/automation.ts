import { create } from 'zustand';
import { automationAPI } from '@/lib/api';

export interface Automation {
  id: string;
  type: 'margin_guard' | 'tp_sl' | 'auto_entry';
  config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationStats {
  total: number;
  active: number;
  inactive: number;
  byType: {
    margin_guard: number;
    tp_sl: number;
    auto_entry: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    is_active: boolean;
    updated_at: string;
  }>;
}

interface AutomationState {
  automations: Automation[];
  stats: AutomationStats | null;
  isLoading: boolean;
  error: string | null;
}

interface AutomationActions {
  fetchAutomations: (params?: {
    type?: string;
    is_active?: boolean;
  }) => Promise<void>;
  createAutomation: (data: {
    type: string;
    config: any;
  }) => Promise<Automation>;
  updateAutomation: (
    id: string,
    data: { config?: any; is_active?: boolean }
  ) => Promise<Automation>;
  deleteAutomation: (id: string) => Promise<void>;
  toggleAutomation: (id: string) => Promise<Automation>;
  fetchStats: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAutomationStore = create<AutomationState & AutomationActions>(
  (set, get) => ({
    // State
    automations: [],
    stats: null,
    isLoading: false,
    error: null,

    // Actions
    fetchAutomations: async params => {
      console.log('🔍 AUTOMATION STORE - fetchAutomations called with params:', params);
      set({ isLoading: true, error: null });

      try {
        const response = await automationAPI.getAll(params);
        console.log('🔍 AUTOMATION STORE - fetchAutomations response:', response.data);
        set({
          automations: response.data.data,
          isLoading: false,
          error: null,
        });
        console.log('🔍 AUTOMATION STORE - automations updated:', response.data.data);
      } catch (error: any) {
        console.error('🔍 AUTOMATION STORE - fetchAutomations error:', error);
        const errorMessage =
          error.response?.data?.message || 'Failed to fetch automations';
        set({
          isLoading: false,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
    },

    createAutomation: async data => {
      set({ isLoading: true, error: null });

      try {
        const response = await automationAPI.create(data);
        const newAutomation = response.data.data;

        set(state => ({
          automations: [newAutomation, ...state.automations],
          isLoading: false,
          error: null,
        }));

        return newAutomation;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Failed to create automation';
        set({
          isLoading: false,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
    },

    updateAutomation: async (id, data) => {
      set({ isLoading: true, error: null });

      try {
        const response = await automationAPI.update(id, data);
        const updatedAutomation = response.data.data;

        set(state => ({
          automations: state.automations.map(automation =>
            automation.id === id ? updatedAutomation : automation
          ),
          isLoading: false,
          error: null,
        }));

        return updatedAutomation;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Failed to update automation';
        set({
          isLoading: false,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
    },

    deleteAutomation: async id => {
      set({ isLoading: true, error: null });

      try {
        await automationAPI.delete(id);

        set(state => ({
          automations: state.automations.filter(
            automation => automation.id !== id
          ),
          isLoading: false,
          error: null,
        }));
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Failed to delete automation';
        set({
          isLoading: false,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
    },

    toggleAutomation: async id => {
      set({ isLoading: true, error: null });

      try {
        const response = await automationAPI.toggle(id);
        const toggledAutomation = response.data.data;

        set(state => ({
          automations: state.automations.map(automation =>
            automation.id === id ? toggledAutomation : automation
          ),
          isLoading: false,
          error: null,
        }));

        return toggledAutomation;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Failed to toggle automation';
        set({
          isLoading: false,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
    },

    fetchStats: async () => {
      set({ isLoading: true, error: null });

      try {
        const response = await automationAPI.getStats();
        set({
          stats: response.data.data,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Failed to fetch stats';
        set({
          isLoading: false,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
    },

    clearError: () => set({ error: null }),
    setLoading: (loading: boolean) => set({ isLoading: loading }),
  })
);
