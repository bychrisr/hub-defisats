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
          className: 'bg-success/20 text-success border-success/30 hover:bg-success/30',
          color: 'text-success'
        };
      case 'connecting':
        return {
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          text: 'Conectando...',
          className: 'bg-warning/20 text-warning border-warning/30 hover:bg-warning/30',
          color: 'text-warning'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Erro de Conexão',
          className: 'bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30',
          color: 'text-destructive'
        };
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Desconectado',
          className: 'bg-muted/20 text-muted-foreground border-muted/30 hover:bg-muted/30',
          color: 'text-muted-foreground'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const lastUpdateTime = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Nunca';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200",
          statusInfo.className
        )}
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
