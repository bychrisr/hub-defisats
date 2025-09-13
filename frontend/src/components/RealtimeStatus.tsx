import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useConnectionStatus } from '@/contexts/RealtimeDataContext';
import { cn } from '@/lib/utils';

interface RealtimeStatusProps {
  className?: string;
  showReconnectButton?: boolean;
}

const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ 
  className, 
  showReconnectButton = true 
}) => {
  const { isConnected, status, lastUpdate, reconnect } = useConnectionStatus();

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="h-3 w-3" />,
          text: 'Tempo Real',
          variant: 'default' as const,
          color: 'text-success'
        };
      case 'connecting':
        return {
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          text: 'Conectando...',
          variant: 'secondary' as const,
          color: 'text-warning'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Erro de Conexão',
          variant: 'destructive' as const,
          color: 'text-destructive'
        };
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Desconectado',
          variant: 'outline' as const,
          color: 'text-text-secondary'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const lastUpdateTime = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Nunca';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant={statusInfo.variant}
        className={cn("flex items-center gap-1", statusInfo.color)}
      >
        {statusInfo.icon}
        {statusInfo.text}
      </Badge>
      
      {isConnected && (
        <span className="text-xs text-muted-foreground">
          Atualizado: {lastUpdateTime}
        </span>
      )}
      
      {showReconnectButton && !isConnected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={reconnect}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconectar
        </Button>
      )}
    </div>
  );
};

export default RealtimeStatus;
