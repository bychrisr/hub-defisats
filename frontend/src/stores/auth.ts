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
  first_login_at?: string;
  onboarding_completed?: boolean;
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
  showResendEmailModal: boolean;
}

interface AuthActions {
  login: (emailOrUsername: string, password: string) => Promise<void>;
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
      showResendEmailModal: false,

      // Actions
      login: async (emailOrUsername: string, password: string) => {
        console.log('🔄 AUTH STORE - login function called');
        console.log('🔄 AUTH STORE - emailOrUsername:', emailOrUsername);
        console.log('🔄 AUTH STORE - password length:', password?.length || 0);
        
        set({ isLoading: true, error: null });
        console.log('🔄 AUTH STORE - isLoading set to true');

        try {
          console.log('🔄 AUTH STORE - Calling authAPI.login...');
          console.log('🔄 AUTH STORE - About to await authAPI.login...');
          
          const response = await authAPI.login({ emailOrUsername, password });
          console.log('🔄 AUTH STORE - authAPI.login response received:', response);
          console.log('🔄 AUTH STORE - response type:', typeof response);
          console.log('🔄 AUTH STORE - response.data:', response.data);
          console.log('🔄 AUTH STORE - response.status:', response.status);
          
          const { user_id, token, refresh_token, plan_type, requiresOnboarding, onboardingCompleted, firstLoginAt } = response.data;
          console.log('🔄 AUTH STORE - Destructured response data:', { user_id, token: token ? 'EXISTS' : 'MISSING', refresh_token: refresh_token ? 'EXISTS' : 'MISSING', plan_type, requiresOnboarding, onboardingCompleted, firstLoginAt });

          // Store tokens
          console.log('💾 Storing token in localStorage:', '[REDACTED]');
          console.log('💾 Token length:', token?.length || 0);
          console.log('💾 Token preview:', token?.substring(0, 50) + '...' || 'null');
          localStorage.setItem('access_token', token);
          
          // Verify token was stored
          const storedToken = localStorage.getItem('access_token');
          console.log('🔍 Verification - Token stored?', storedToken ? 'YES' : 'NO');
          console.log('🔍 Verification - Stored token matches?', storedToken === token);
          
          if (refresh_token) {
            console.log('💾 Storing refresh token in localStorage:', '[REDACTED]');
            localStorage.setItem('refresh_token', refresh_token);
          }
          console.log('✅ Tokens stored successfully');

          // Call getProfile to get full user data and set isInitialized
          console.log('🔄 LOGIN - Calling getProfile after login...');
          await get().getProfile();
          
        } catch (error: any) {
          console.log('❌ AUTH STORE - Error in login function:', error);
          console.log('❌ AUTH STORE - Error type:', typeof error);
          console.log('❌ AUTH STORE - Error message:', error.message);
          console.log('❌ AUTH STORE - Error response:', error.response);
          console.log('❌ AUTH STORE - Error status:', error.response?.status);
          console.log('❌ AUTH STORE - Error data:', error.response?.data);
          
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          
          // Verificar se é erro de email não verificado
          if (errorMessage === 'EMAIL_NOT_VERIFIED') {
            set({ 
              error: 'Por favor, verifique seu email antes de fazer login. Verifique sua caixa de entrada e spam.',
              isLoading: false,
              showResendEmailModal: true,
            });
            throw new Error('EMAIL_NOT_VERIFIED');
          }
          console.log('❌ AUTH STORE - Error message to set:', errorMessage);
          
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
          console.log('💾 Storing token in localStorage:', '[REDACTED]');
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
            isInitialized: true,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || 'Registration failed';
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

      logout: async () => {
        console.log('🚪 Logout: Starting logout process...');
        set({ isLoading: true });

        try {
          // Clear tokens first to prevent any API calls during logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          
          // Try backend logout with timeout
          await Promise.race([
            authAPI.logout(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 5000))
          ]);
          console.log('✅ Logout: Backend logout successful');
        } catch (error) {
          console.log('⚠️ Logout: Backend logout failed, but continuing with local cleanup:', error);
        } finally {
          // Ensure state is cleared
          console.log('🧹 Logout: Clearing state...');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
          
          console.log('✅ Logout: Logout completed successfully');
        }
      },

      getProfile: async () => {
        console.log('🔄 AUTH STORE - Starting getProfile...', {
          timestamp: new Date().toISOString(),
          currentState: {
            isAuthenticated: get().isAuthenticated,
            isLoading: get().isLoading,
            userExists: !!get().user
          }
        });
        
        // Check token before making request
        const tokenBeforeRequest = localStorage.getItem('access_token');
        console.log('🔍 AUTH STORE - Token before getProfile request:', {
          exists: !!tokenBeforeRequest,
          length: tokenBeforeRequest?.length,
          preview: tokenBeforeRequest?.substring(0, 50) + '...' || 'null',
          end: '...' + tokenBeforeRequest?.substring(tokenBeforeRequest.length - 20) || 'null',
          timestamp: new Date().toISOString()
        });
        
        set({ isLoading: true });

        try {
          console.log('🔄 AUTH STORE - Calling authAPI.getProfile...', {
            timestamp: new Date().toISOString()
          });
          const response = await authAPI.getProfile();
          const user = response.data;
          console.log('✅ AUTH STORE - Profile received:', {
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin,
            onboardingCompleted: user.onboarding_completed,
            planType: user.plan_type,
            timestamp: new Date().toISOString()
          });

          // Usar o campo is_admin que vem do backend
          const isAdmin = user.is_admin === true;
          console.log('🔍 AUTH STORE - Is admin:', {
            isAdmin,
            email: user.email,
            backendValue: user.is_admin,
            timestamp: new Date().toISOString()
          });

          set({
            user: {
              ...user,
              is_admin: isAdmin,
              first_login_at: user.first_login_at,
              onboarding_completed: user.onboarding_completed,
            },
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
          console.log('✅ AUTH STORE - Profile set successfully:', {
            isAuthenticated: true,
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          console.log('❌ AUTH STORE - getProfile error:', {
            errorMessage: error.message,
            errorName: error.name,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            timestamp: new Date().toISOString()
          });
          
          const errorMessage =
            error.response?.data?.message || 'Failed to get profile';
          console.log('❌ AUTH STORE - Error message:', errorMessage);
          
          // Check token before potentially clearing it
          const tokenBeforeClearing = localStorage.getItem('access_token');
          console.log('🔍 AUTH STORE - Token before potential clearing:', tokenBeforeClearing ? 'EXISTS' : 'MISSING');
          
          // Se o erro for de token expirado, limpar localStorage
          if (error.response?.status === 401 || errorMessage.includes('Invalid session') || errorMessage.includes('UNAUTHORIZED')) {
            console.log('🔑 AUTH STORE - Token expired/invalid, clearing localStorage');
            console.log('🔑 AUTH STORE - Removing tokens from localStorage...');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            console.log('🔑 AUTH STORE - Tokens removed from localStorage');
          } else {
            console.log('🔍 AUTH STORE - Error is not 401/auth related, keeping tokens');
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
      
      // Getter para token
      get token() {
        return localStorage.getItem('access_token');
      },
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
            state.set({ 
              isAuthenticated: false, 
              user: null, 
              isLoading: false, 
              isInitialized: true,
              error: null
            });
          } else {
            // Token exists, validate it by calling getProfile
            console.log('✅ onRehydrateStorage: Token exists, validating...');
            state.set({ 
              isLoading: true, 
              isInitialized: false,
              error: null 
            });
            
            // ✅ CORREÇÃO: Validação simplificada para evitar loops
            // Não chamar getProfile() durante rehidratação para evitar loops infinitos
            console.log('✅ onRehydrateStorage: Token exists, setting authenticated state');
            state.set({ 
              isAuthenticated: true,
              isLoading: false, 
              isInitialized: true,
              error: null
            });
            
            // Validar token em background sem bloquear a inicialização
            setTimeout(() => {
              state.get().getProfile().catch((error) => {
                console.log('❌ Background token validation failed:', error.message);
                // Se falhar, limpar tokens e desautenticar
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                state.set({ 
                  isAuthenticated: false, 
                  user: null, 
                  isLoading: false, 
                  isInitialized: true,
                  error: null
                });
              });
            }, 100);
          }
        }
      },
    }
  )
);
