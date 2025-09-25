import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  [key: string]: any;
}

interface OfflineModeState {
  isOnline: boolean;
  isOfflineMode: boolean;
  offlineData: OfflineData;
  lastSyncTime: Date | null;
  pendingActions: Array<{
    id: string;
    action: string;
    data: any;
    timestamp: Date;
  }>;
}

export const useOfflineMode = () => {
  const [state, setState] = useState<OfflineModeState>({
    isOnline: navigator.onLine,
    isOfflineMode: false,
    offlineData: {},
    lastSyncTime: null,
    pendingActions: [],
  });

  // Salvar dados offline no localStorage
  const saveOfflineData = useCallback((key: string, data: any) => {
    try {
      const offlineData = { ...state.offlineData, [key]: data };
      setState(prev => ({ ...prev, offlineData }));
      
      // Salvar no localStorage
      localStorage.setItem('hub-defisats-offline-data', JSON.stringify(offlineData));
      
      console.log('[Offline] Dados salvos offline:', key);
    } catch (error) {
      console.error('[Offline] Erro ao salvar dados offline:', error);
    }
  }, [state.offlineData]);

  // Carregar dados offline do localStorage
  const loadOfflineData = useCallback(() => {
    try {
      const savedData = localStorage.getItem('hub-defisats-offline-data');
      if (savedData) {
        const offlineData = JSON.parse(savedData);
        setState(prev => ({ ...prev, offlineData }));
        console.log('[Offline] Dados carregados do localStorage');
      }
    } catch (error) {
      console.error('[Offline] Erro ao carregar dados offline:', error);
    }
  }, []);

  // Adicionar ação pendente
  const addPendingAction = useCallback((action: string, data: any) => {
    const pendingAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      pendingActions: [...prev.pendingActions, pendingAction],
    }));

    // Salvar no localStorage
    try {
      const savedActions = localStorage.getItem('hub-defisats-pending-actions');
      const actions = savedActions ? JSON.parse(savedActions) : [];
      actions.push(pendingAction);
      localStorage.setItem('hub-defisats-pending-actions', JSON.stringify(actions));
    } catch (error) {
      console.error('[Offline] Erro ao salvar ação pendente:', error);
    }

    console.log('[Offline] Ação pendente adicionada:', action);
  }, []);

  // Sincronizar ações pendentes quando voltar online
  const syncPendingActions = useCallback(async () => {
    if (state.pendingActions.length === 0) return;

    console.log('[Offline] Sincronizando ações pendentes...');
    
    for (const action of state.pendingActions) {
      try {
        // Aqui você implementaria a lógica de sincronização específica
        // Por exemplo, enviar dados para a API
        console.log('[Offline] Sincronizando ação:', action.action, action.data);
        
        // Simular sincronização
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('[Offline] Erro ao sincronizar ação:', action.id, error);
      }
    }

    // Limpar ações pendentes após sincronização
    setState(prev => ({
      ...prev,
      pendingActions: [],
      lastSyncTime: new Date(),
    }));

    // Limpar do localStorage
    localStorage.removeItem('hub-defisats-pending-actions');
    
    console.log('[Offline] Sincronização concluída');
  }, [state.pendingActions]);

  // Verificar status da conexão
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true, isOfflineMode: false }));
      console.log('[Offline] Conexão restaurada');
      
      // Sincronizar ações pendentes
      setTimeout(syncPendingActions, 1000);
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, isOfflineMode: true }));
      console.log('[Offline] Modo offline ativado');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingActions]);

  // Carregar dados offline na inicialização
  useEffect(() => {
    loadOfflineData();
    
    // Carregar ações pendentes
    try {
      const savedActions = localStorage.getItem('hub-defisats-pending-actions');
      if (savedActions) {
        const actions = JSON.parse(savedActions);
        setState(prev => ({ ...prev, pendingActions: actions }));
      }
    } catch (error) {
      console.error('[Offline] Erro ao carregar ações pendentes:', error);
    }
  }, [loadOfflineData]);

  // Função para obter dados offline
  const getOfflineData = useCallback((key: string) => {
    return state.offlineData[key] || null;
  }, [state.offlineData]);

  // Função para verificar se há dados offline
  const hasOfflineData = useCallback((key: string) => {
    return key in state.offlineData;
  }, [state.offlineData]);

  // Função para limpar dados offline
  const clearOfflineData = useCallback(() => {
    setState(prev => ({
      ...prev,
      offlineData: {},
      pendingActions: [],
    }));
    
    localStorage.removeItem('hub-defisats-offline-data');
    localStorage.removeItem('hub-defisats-pending-actions');
    
    console.log('[Offline] Dados offline limpos');
  }, []);

  return {
    ...state,
    saveOfflineData,
    getOfflineData,
    hasOfflineData,
    addPendingAction,
    clearOfflineData,
    syncPendingActions,
  };
};

// Hook para dados offline específicos
export const useOfflineData = (key: string, defaultValue: any = null) => {
  const { getOfflineData, saveOfflineData, hasOfflineData } = useOfflineMode();
  
  const data = getOfflineData(key) || defaultValue;
  const hasData = hasOfflineData(key);
  
  const setData = useCallback((newData: any) => {
    saveOfflineData(key, newData);
  }, [key, saveOfflineData]);
  
  return {
    data,
    hasData,
    setData,
  };
};