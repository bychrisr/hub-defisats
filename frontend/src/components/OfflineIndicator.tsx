import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useOfflineMode } from '@/hooks/useOfflineMode';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator = ({ className }: OfflineIndicatorProps) => {
  const { 
    isOnline, 
    isOfflineMode, 
    pendingActions, 
    lastSyncTime,
    syncPendingActions 
  } = useOfflineMode();

  if (isOnline && !isOfflineMode) {
    return null; // Não mostrar quando online
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  return (
    <div className={cn('fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50', className)}>
      <div className="bg-card/95 backdrop-blur-sm border border-orange-200 dark:border-orange-800 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {isOnline ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-orange-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-sm font-medium">
                {isOnline ? 'Sincronizando...' : 'Modo Offline'}
              </h3>
              <Badge 
                variant={isOnline ? "default" : "secondary"}
                className="text-xs"
              >
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            
            <div className="space-y-2 text-xs text-muted-foreground">
              {!isOnline && (
                <p>
                  Você está offline. Algumas funcionalidades podem estar limitadas.
                </p>
              )}
              
              {pendingActions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>
                    {pendingActions.length} ação(ões) pendente(s)
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-3 w-3" />
                <span>
                  Última sincronização: {formatLastSync(lastSyncTime)}
                </span>
              </div>
            </div>
            
            {isOnline && pendingActions.length > 0 && (
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={syncPendingActions}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Agora
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar status offline na barra superior
export const OfflineStatus = () => {
  const { isOnline, isOfflineMode, pendingActions } = useOfflineMode();

  if (isOnline && !isOfflineMode) return null;

  return (
    <div className="flex items-center space-x-2 text-xs">
      {!isOnline && (
        <Badge variant="destructive" className="text-xs">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}
      
      {pendingActions.length > 0 && (
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {pendingActions.length}
        </Badge>
      )}
    </div>
  );
};
