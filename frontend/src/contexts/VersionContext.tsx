import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { versionService, VersionCheckResult } from '../services/version.service';

interface VersionContextType {
  versionInfo: VersionCheckResult | null;
  hasUpdate: boolean;
  isChecking: boolean;
  checkForUpdates: () => Promise<void>;
  markAsNotified: () => void;
  forceCheck: () => Promise<void>;
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

interface VersionProviderProps {
  children: React.ReactNode;
  autoCheck?: boolean;
  checkInterval?: number;
}

export const VersionProvider: React.FC<VersionProviderProps> = ({ 
  children, 
  autoCheck = true,
  checkInterval = 5 * 60 * 1000 // 5 minutos por padrão
}) => {
  const [versionInfo, setVersionInfo] = useState<VersionCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkForUpdates = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      console.log('🔄 VERSION CONTEXT - Checking for updates...');
      const result = await versionService.checkForUpdates();
      setVersionInfo(result);
      
      if (result.hasUpdate) {
        console.log('🆕 VERSION CONTEXT - Update available!', result);
      }
    } catch (error) {
      console.error('❌ VERSION CONTEXT - Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  const forceCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      console.log('🔄 VERSION CONTEXT - Force checking for updates...');
      const result = await versionService.forceCheck();
      setVersionInfo(result);
    } catch (error) {
      console.error('❌ VERSION CONTEXT - Error force checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const markAsNotified = useCallback(() => {
    if (versionInfo?.latestVersion) {
      versionService.markAsNotified(versionInfo.latestVersion);
      console.log('✅ VERSION CONTEXT - Marked version as notified:', versionInfo.latestVersion);
    }
  }, [versionInfo]);

  // Inicializa o serviço e carrega informações salvas
  useEffect(() => {
    console.log('🚀 VERSION CONTEXT - Initializing version service');
    
    // Carrega informações salvas do localStorage
    const storedInfo = versionService.getStoredVersionInfo();
    if (storedInfo) {
      setVersionInfo(storedInfo);
      console.log('📦 VERSION CONTEXT - Loaded stored version info:', storedInfo);
    }

    // Inicia verificação automática se habilitada
    if (autoCheck) {
      versionService.startVersionCheck();
      
      // Verifica imediatamente
      checkForUpdates();
    }

    // Cleanup ao desmontar
    return () => {
      if (autoCheck) {
        versionService.stopVersionCheck();
      }
    };
  }, [autoCheck, checkForUpdates]);

  // Verifica se há atualização disponível
  const hasUpdate = versionInfo?.hasUpdate || false;

  const contextValue: VersionContextType = {
    versionInfo,
    hasUpdate,
    isChecking,
    checkForUpdates,
    markAsNotified,
    forceCheck
  };

  return (
    <VersionContext.Provider value={contextValue}>
      {children}
    </VersionContext.Provider>
  );
};

export const useVersion = (): VersionContextType => {
  const context = useContext(VersionContext);
  if (context === undefined) {
    throw new Error('useVersion must be used within a VersionProvider');
  }
  return context;
};

// Hook para verificar se deve mostrar o popup de atualização
export const useUpdateNotification = () => {
  const { versionInfo, hasUpdate, markAsNotified } = useVersion();
  
  const shouldShowNotification = hasUpdate && versionInfo && 
    !versionService.hasBeenNotified(versionInfo.latestVersion);

  // Debug logging
  console.log('🔍 UPDATE NOTIFICATION DEBUG:', {
    hasUpdate,
    versionInfo,
    shouldShowNotification,
    hasBeenNotified: versionInfo ? versionService.hasBeenNotified(versionInfo.latestVersion) : 'no version info',
    currentVersion: versionService.getCurrentVersion()
  });

  const handleNotificationShown = () => {
    markAsNotified();
  };

  return {
    shouldShowNotification,
    versionInfo,
    handleNotificationShown
  };
};
