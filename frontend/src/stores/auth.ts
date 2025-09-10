import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  plan_type: 'free' | 'basic' | 'advanced' | 'pro';
  email_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
  ln_markets_api_key?: string;
  ln_markets_api_secret?: string;
  ln_markets_passphrase?: string;
  is_admin?: boolean; // Flag para identificar usuários admin
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Flag para saber se a inicialização foi concluída
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    ln_markets_api_key: string;
    ln_markets_api_secret: string;
    ln_markets_passphrase: string;
    coupon_code?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authAPI.login({ email, password });
          const { user_id, token, plan_type } = response.data;

          // Store token
          console.log('💾 Storing token in localStorage:', token.substring(0, 20) + '...');
          localStorage.setItem('access_token', token);
          console.log('✅ Token stored successfully');

          // Call getProfile to get full user data and set isInitialized
          console.log('🔄 LOGIN - Calling getProfile after login...');
          await get().getProfile();
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      register: async data => {
        set({ isLoading: true, error: null });

        try {
          const response = await authAPI.register(data);
          const { user_id, token, plan_type } = response.data;

          // Store token
          console.log('💾 Storing token in localStorage:', token.substring(0, 20) + '...');
          localStorage.setItem('access_token', token);
          console.log('✅ Token stored successfully');

          set({
            user: {
              id: user_id,
              plan_type: plan_type,
              email: data.email,
              email_verified: false,
              two_factor_enabled: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || 'Registration failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        console.log('🚪 Logout: Starting logout process...');
        set({ isLoading: true });

        try {
          await authAPI.logout();
          console.log('✅ Logout: Backend logout successful');
        } catch (error) {
          console.log('⚠️ Logout: Backend logout failed, but continuing with local cleanup');
        } finally {
          // Clear tokens and state
          console.log('🧹 Logout: Clearing localStorage and state...');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
          console.log('✅ Logout: Logout completed successfully');
        }
      },

      getProfile: async () => {
        console.log('🔄 AUTH STORE - Starting getProfile...');
        set({ isLoading: true });

        try {
          console.log('🔄 AUTH STORE - Calling authAPI.getProfile...');
          const response = await authAPI.getProfile();
          const user = response.data;
          console.log('✅ AUTH STORE - Profile received:', user);

          // Verificar se é admin baseado no email
          const isAdmin = user.email === 'admin@hub-defisats.com';
          console.log('🔍 AUTH STORE - Is admin:', isAdmin);

          set({
            user: {
              ...user,
              is_admin: isAdmin,
            },
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
          console.log('✅ AUTH STORE - Profile set successfully');
        } catch (error: any) {
          console.log('❌ AUTH STORE - getProfile error:', error);
          const errorMessage =
            error.response?.data?.message || 'Failed to get profile';
          console.log('❌ AUTH STORE - Error message:', errorMessage);
          
          // Se o erro for de token expirado, limpar localStorage
          if (error.response?.status === 401 || errorMessage.includes('Invalid session') || errorMessage.includes('UNAUTHORIZED')) {
            console.log('🔑 AUTH STORE - Token expired/invalid, clearing localStorage');
            localStorage.removeItem('access_token');
          }
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        // Don't persist isAuthenticated - it should be calculated from token presence
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Check if there's a valid token in localStorage
          const token = localStorage.getItem('access_token');
          console.log('🔄 onRehydrateStorage - Token from localStorage:', token ? 'EXISTS' : 'MISSING');
          
          if (!token) {
            // No token means not authenticated
            console.log('❌ onRehydrateStorage: No token, setting isAuthenticated: false');
            state.set({ isAuthenticated: false, user: null, isLoading: false, isInitialized: true });
          } else {
            // Token exists, but don't set isAuthenticated yet - wait for getProfile
            console.log('✅ onRehydrateStorage: Token exists, will wait for getProfile to complete');
            state.set({ isLoading: true, isInitialized: false }); // Set loading to true so AdminRoute waits
          }
        }
      },
    }
  )
);
