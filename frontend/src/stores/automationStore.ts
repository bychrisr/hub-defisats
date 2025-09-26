// frontend/src/stores/automationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface MarginGuardConfig {
  enabled: boolean;
  threshold: number;
  action: 'add_margin' | 'close_position' | 'reduce_position';
  add_margin_amount?: number;
  reduce_percentage?: number;
}

interface AutomationState {
  config: MarginGuardConfig | null;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  saveConfig: (config: MarginGuardConfig) => Promise<void>;
}

export const useAutomationStore = create<AutomationState>()(
  devtools(
    (set, get) => ({
      config: null,
      isLoading: false,
      error: null,

      fetchConfig: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('🔍 AUTOMATION STORE - Buscando configuração...');
          
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Token não encontrado');
          }

          const response = await fetch('/api/automation/config', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('Sessão expirada. Faça login novamente.');
            }
            throw new Error('Falha ao carregar configurações.');
          }

          const data = await response.json();
          console.log('✅ AUTOMATION STORE - Configuração carregada:', data.config);
          
          set({ config: data.config || null });
        } catch (error: any) {
          console.error('❌ AUTOMATION STORE - Erro ao buscar configuração:', error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },

      saveConfig: async (config: MarginGuardConfig) => {
        set({ isLoading: true, error: null });
        try {
          console.log('💾 AUTOMATION STORE - Salvando configuração:', config);
          
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Token não encontrado');
          }

          const response = await fetch('/api/automation/config', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
          });

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('Sessão expirada. Faça login novamente.');
            }
            throw new Error('Falha ao salvar configurações.');
          }

          const data = await response.json();
          console.log('✅ AUTOMATION STORE - Configuração salva:', data);
          
          set({ config }); // Atualiza o store local após salvar
        } catch (error: any) {
          console.error('❌ AUTOMATION STORE - Erro ao salvar configuração:', error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    { name: 'automation-store' }
  )
);
