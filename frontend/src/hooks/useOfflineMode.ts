import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { globalDebug } from './useDebug';
import { useLocalCache } from './useCacheBusting';

interface OfflineData {
  dashboard: any;
  positions: any;
  automations: any;
  backtests: any;
  timestamp: number;
  version: string;
}

interface OfflineStatus {
  isOnline: boolean;
  isOfflineMode: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  cachedDataAvailable: boolean;
}

export const useOfflineMode = () => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isOfflineMode: false,
    lastSyncTime: null,
    pendingChanges: 0,
    cachedDataAvailable: false,
  });

  const pendingChangesRef = useRef<Array<() => Promise<any>>>([]);
  const { setCache, getCache } = useLocalCache<OfflineData>('offline_data');

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      globalDebug.info('offline', 'Back online');
      setStatus(prev => ({ ...prev, isOnline: true, isOfflineMode: false }));
      toast.success('Conexão restaurada!');

      // Process pending changes
      processPendingChanges();
    };

    const handleOffline = () => {
      globalDebug.warn('offline', 'Connection lost - switching to offline mode');
      setStatus(prev => ({ ...prev, isOnline: false, isOfflineMode: true }));
      toast.warning('Sem conexão - funcionando em modo offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOfflineData = useCallback(async (data: Partial<OfflineData>) => {
    try {
      const existingData = getCache() || {
        dashboard: null,
        positions: null,
        automations: null,
        backtests: null,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      const updatedData = {
        ...existingData,
        ...data,
        timestamp: Date.now(),
      };

      setCache(updatedData);

      setStatus(prev => ({
        ...prev,
        cachedDataAvailable: true,
        lastSyncTime: new Date(),
      }));

      globalDebug.debug('offline', 'Offline data saved', { dataKeys: Object.keys(data) });
    } catch (error) {
      globalDebug.error('offline', 'Failed to save offline data', error);
    }
  }, [setCache, getCache]);

  const loadOfflineData = useCallback((): OfflineData | null => {
    try {
      const data = getCache();
      if (data) {
        globalDebug.debug('offline', 'Offline data loaded', {
          age: Date.now() - data.timestamp,
          version: data.version,
        });
        return data;
      }
    } catch (error) {
      globalDebug.error('offline', 'Failed to load offline data', error);
    }
    return null;
  }, [getCache]);

  const addPendingChange = useCallback((changeFn: () => Promise<any>) => {
    pendingChangesRef.current.push(changeFn);
    setStatus(prev => ({ ...prev, pendingChanges: prev.pendingChanges + 1 }));

    globalDebug.debug('offline', 'Pending change added', {
      totalPending: pendingChangesRef.current.length,
    });
  }, []);

  const processPendingChanges = useCallback(async () => {
    if (pendingChangesRef.current.length === 0) return;

    globalDebug.info('offline', `Processing ${pendingChangesRef.current.length} pending changes`);

    const changes = [...pendingChangesRef.current];
    pendingChangesRef.current = [];

    let successCount = 0;
    let errorCount = 0;

    for (const change of changes) {
      try {
        await change();
        successCount++;
      } catch (error) {
        errorCount++;
        globalDebug.error('offline', 'Failed to process pending change', error);
      }
    }

    setStatus(prev => ({
      ...prev,
      pendingChanges: errorCount, // Keep failed changes
    }));

    if (successCount > 0) {
      toast.success(`${successCount} alterações sincronizadas com sucesso!`);
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} alterações falharam ao sincronizar.`);
    }

    globalDebug.info('offline', 'Pending changes processed', {
      total: changes.length,
      success: successCount,
      errors: errorCount,
    });
  }, []);

  const clearOfflineData = useCallback(() => {
    try {
      setCache(null as any); // This will effectively clear the cache
      setStatus(prev => ({
        ...prev,
        cachedDataAvailable: false,
        lastSyncTime: null,
      }));

      globalDebug.info('offline', 'Offline data cleared');
      toast.info('Dados offline limpos');
    } catch (error) {
      globalDebug.error('offline', 'Failed to clear offline data', error);
    }
  }, [setCache]);

  const getOfflineStats = useCallback(() => {
    const data = loadOfflineData();
    const pendingCount = pendingChangesRef.current.length;

    return {
      hasData: !!data,
      dataAge: data ? Date.now() - data.timestamp : 0,
      pendingChanges: pendingCount,
      lastSyncTime: status.lastSyncTime,
      isOnline: status.isOnline,
      isOfflineMode: status.isOfflineMode,
    };
  }, [loadOfflineData, status]);

  // Auto-sync when back online
  useEffect(() => {
    if (status.isOnline && !status.isOfflineMode && pendingChangesRef.current.length > 0) {
      const timer = setTimeout(() => {
        processPendingChanges();
      }, 1000); // Wait 1 second after coming online

      return () => clearTimeout(timer);
    }
  }, [status.isOnline, status.isOfflineMode, processPendingChanges]);

  return {
    // Status
    status,
    stats: getOfflineStats(),

    // Data management
    saveOfflineData,
    loadOfflineData,
    clearOfflineData,

    // Change management
    addPendingChange,
    processPendingChanges,

    // Utilities
    isOnline: status.isOnline,
    isOfflineMode: status.isOfflineMode,
    hasCachedData: status.cachedDataAvailable,
  };
};

// Hook específico para componentes que precisam funcionar offline
export const useOfflineComponent = <T>(
  onlineFetchFn: () => Promise<T>,
  options: {
    cacheKey?: string;
    enabled?: boolean;
    onOfflineData?: (data: T) => void;
  } = {}
) => {
  const { enabled = true, cacheKey = 'component_data', onOfflineData } = options;
  const { status, saveOfflineData, loadOfflineData } = useOfflineMode();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      if (status.isOnline) {
        // Online mode - fetch fresh data
        const freshData = await onlineFetchFn();
        setData(freshData);

        // Cache for offline use
        await saveOfflineData({ [cacheKey]: freshData });

        globalDebug.debug('offline-component', `Fresh data loaded for ${cacheKey}`);
      } else {
        // Offline mode - load from cache
        const cachedData = loadOfflineData();
        const componentData = cachedData?.[cacheKey as keyof OfflineData] as T;

        if (componentData) {
          setData(componentData);
          if (onOfflineData) {
            onOfflineData(componentData);
          }
          globalDebug.debug('offline-component', `Cached data loaded for ${cacheKey}`);
          toast.info('Dados carregados do cache offline');
        } else {
          throw new Error('No cached data available');
        }
      }
    } catch (err) {
      const error = err as Error;
      setError(error);

      if (status.isOnline) {
        globalDebug.error('offline-component', `Failed to fetch data for ${cacheKey}`, error);
        toast.error('Erro ao carregar dados');
      } else {
        globalDebug.warn('offline-component', `No cached data available for ${cacheKey}`);
        toast.warning('Sem conexão e sem dados em cache');
      }
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    status.isOnline,
    onlineFetchFn,
    saveOfflineData,
    loadOfflineData,
    cacheKey,
    onOfflineData,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isOnline: status.isOnline,
    isOfflineMode: status.isOfflineMode,
    refetch: fetchData,
  };
};

// Hook para detectar mudanças de conectividade
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      globalDebug.info('connection', 'Connection restored');
      toast.success('Conexão restaurada');
    };

    const handleOffline = () => {
      setIsOnline(false);
      globalDebug.warn('connection', 'Connection lost');
      toast.warning('Conexão perdida - modo offline ativado');
    };

    // Detect connection type (if supported)
    const updateConnectionType = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateConnectionType);
      updateConnectionType();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  return {
    isOnline,
    connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g',
    isFastConnection: connectionType === '4g' || connectionType === '5g',
  };
};
