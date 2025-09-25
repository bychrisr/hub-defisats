import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallPromptProps {
  className?: string;
}

export const PWAInstallPrompt = ({ className }: PWAInstallPromptProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const { 
    isInstalled, 
    isInstallable, 
    isOnline, 
    isUpdateAvailable, 
    installPWA, 
    updatePWA, 
    clearCache 
  } = usePWA();

  // Não mostrar se já estiver instalado
  if (isInstalled) {
    return null;
  }

  // Não mostrar se não for instalável
  if (!isInstallable && !isUpdateAvailable) {
    return null;
  }

  const handleInstall = async () => {
    await installPWA();
    setIsVisible(false);
  };

  const handleUpdate = () => {
    updatePWA();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn('fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50', className)}>
      <Card className="bg-card/95 backdrop-blur-sm border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HD</span>
              </div>
              <div>
                <CardTitle className="text-sm">Hub DeFiSats</CardTitle>
                <CardDescription className="text-xs">
                  {isUpdateAvailable ? 'Atualização disponível' : 'Instalar app'}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {isUpdateAvailable ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                <span className="text-sm">Nova versão disponível!</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Uma nova versão do app está disponível com melhorias e correções.
              </p>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleUpdate}
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button 
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                >
                  Depois
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4 text-primary" />
                <span className="text-sm">Instalar no seu dispositivo</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Instale o Hub DeFiSats para acesso rápido e funcionalidades offline.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <Smartphone className="h-3 w-3" />
                  <span>Acesso rápido</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Monitor className="h-3 w-3" />
                  <span>Experiência nativa</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span>Funcionalidades offline</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-red-500" />
                      <span>Modo offline ativo</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Instalar
                </Button>
                <Button 
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                >
                  Depois
                </Button>
              </div>
            </div>
          )}
          
          {/* Status da conexão */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">Offline</span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCache}
                className="h-6 px-2 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar Cache
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para status PWA na barra superior
export const PWAStatus = () => {
  const { isInstalled, isOnline, isUpdateAvailable } = usePWA();

  if (!isInstalled) return null;

  return (
    <div className="flex items-center space-x-2 text-xs">
      {isUpdateAvailable && (
        <Badge variant="destructive" className="text-xs">
          Atualização
        </Badge>
      )}
      {!isOnline && (
        <Badge variant="secondary" className="text-xs">
          Offline
        </Badge>
      )}
      <Badge variant="outline" className="text-xs">
        PWA
      </Badge>
    </div>
  );
};
