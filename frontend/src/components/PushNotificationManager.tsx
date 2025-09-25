import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePWA';

interface PushNotificationManagerProps {
  className?: string;
}

export const PushNotificationManager = ({ className }: PushNotificationManagerProps) => {
  const {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePushNotifications();

  const [isEnabled, setIsEnabled] = useState(false);
  const [settings, setSettings] = useState({
    tradingAlerts: true,
    priceAlerts: true,
    systemNotifications: true,
    marketingEmails: false,
  });

  useEffect(() => {
    setIsEnabled(subscription !== null);
  }, [subscription]);

  const handleToggleNotifications = async () => {
    if (!isSupported) return;

    if (isEnabled) {
      await unsubscribeFromPush();
      setIsEnabled(false);
    } else {
      const hasPermission = await requestPermission();
      if (hasPermission) {
        await subscribeToPush();
        setIsEnabled(true);
      }
    }
  };

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          text: 'Permitido',
          color: 'text-green-500',
        };
      case 'denied':
        return {
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          text: 'Negado',
          color: 'text-red-500',
        };
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
          text: 'Não solicitado',
          color: 'text-yellow-500',
        };
    }
  };

  const permissionStatus = getPermissionStatus();

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellOff className="h-5 w-5" />
            <span>Notificações Push</span>
          </CardTitle>
          <CardDescription>
            Notificações push não são suportadas neste navegador.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Notificações Push</span>
          <Badge 
            variant={isEnabled ? "default" : "secondary"}
            className="text-xs"
          >
            {isEnabled ? 'Ativo' : 'Inativo'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Receba notificações sobre suas posições, alertas de preço e atualizações do sistema.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status da permissão */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            {permissionStatus.icon}
            <span className={`text-sm font-medium ${permissionStatus.color}`}>
              Status: {permissionStatus.text}
            </span>
          </div>
          <Button
            variant={isEnabled ? "destructive" : "default"}
            size="sm"
            onClick={handleToggleNotifications}
            disabled={permission === 'denied'}
          >
            {isEnabled ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Desativar
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Ativar
              </>
            )}
          </Button>
        </div>

        {/* Configurações de notificação */}
        {isEnabled && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Configurações</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Alertas de Trading</span>
                </div>
                <Switch
                  checked={settings.tradingAlerts}
                  onCheckedChange={(value) => handleSettingChange('tradingAlerts', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Alertas de Preço</span>
                </div>
                <Switch
                  checked={settings.priceAlerts}
                  onCheckedChange={(value) => handleSettingChange('priceAlerts', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Notificações do Sistema</span>
                </div>
                <Switch
                  checked={settings.systemNotifications}
                  onCheckedChange={(value) => handleSettingChange('systemNotifications', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">E-mails de Marketing</span>
                </div>
                <Switch
                  checked={settings.marketingEmails}
                  onCheckedChange={(value) => handleSettingChange('marketingEmails', value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Informações sobre notificações */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Como funcionam as notificações:</p>
              <ul className="space-y-1 text-xs">
                <li>• Alertas de Trading: Notificações sobre execução de ordens</li>
                <li>• Alertas de Preço: Avisos quando preços atingem seus alvos</li>
                <li>• Sistema: Atualizações importantes e manutenções</li>
                <li>• Marketing: Promoções e novidades (opcional)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instruções para ativar */}
        {permission === 'denied' && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium mb-1">Permissão negada</p>
                <p className="text-xs">
                  Para ativar as notificações, você precisa permitir notificações nas configurações do seu navegador.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente para mostrar notificações em tempo real
export const NotificationToast = ({ notification, onClose }: { 
  notification: any; 
  onClose: () => void; 
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="bg-card/95 backdrop-blur-sm border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">HD</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium">{notification.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{notification.body}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
