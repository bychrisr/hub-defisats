import { useState, useEffect } from 'react';

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: any;
  swRegistration: ServiceWorkerRegistration | null;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    installPrompt: null,
    swRegistration: null,
  });

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
      
      return isStandalone || (isIOS && isInStandaloneMode);
    };

    // Registrar service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('[PWA] Service Worker registrado:', registration);
          
          setPwaState(prev => ({
            ...prev,
            swRegistration: registration,
            isInstalled: checkIfInstalled(),
          }));

          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setPwaState(prev => ({
                    ...prev,
                    isUpdateAvailable: true,
                  }));
                }
              });
            }
          });

        } catch (error) {
          console.error('[PWA] Erro ao registrar Service Worker:', error);
        }
      }
    };

    // Listener para prompt de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e,
      }));
    };

    // Listener para instalação concluída
    const handleAppInstalled = () => {
      setPwaState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
      }));
    };

    // Listeners para status online/offline
    const handleOnline = () => {
      setPwaState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setPwaState(prev => ({ ...prev, isOnline: false }));
    };

    // Adicionar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Registrar service worker
    registerServiceWorker();

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Função para instalar PWA
  const installPWA = async () => {
    if (pwaState.installPrompt) {
      const result = await pwaState.installPrompt.prompt();
      console.log('[PWA] Resultado do prompt de instalação:', result);
      
      setPwaState(prev => ({
        ...prev,
        installPrompt: null,
      }));
    }
  };

  // Função para atualizar PWA
  const updatePWA = () => {
    if (pwaState.swRegistration?.waiting) {
      pwaState.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Função para limpar cache
  const clearCache = async () => {
    if (pwaState.swRegistration) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[PWA] Cache limpo com sucesso');
        window.location.reload();
      } catch (error) {
        console.error('[PWA] Erro ao limpar cache:', error);
      }
    }
  };

  return {
    ...pwaState,
    installPWA,
    updatePWA,
    clearCache,
  };
};

// Hook para notificações push
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Verificar suporte
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Solicitar permissão para notificações
  const requestPermission = async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('[PWA] Erro ao solicitar permissão:', error);
      return false;
    }
  };

  // Inscrever para notificações push
  const subscribeToPush = async () => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY,
      });

      setSubscription(subscription);
      
      // Enviar subscription para o servidor
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      return subscription;
    } catch (error) {
      console.error('[PWA] Erro ao inscrever para push:', error);
      return null;
    }
  };

  // Cancelar inscrição
  const unsubscribeFromPush = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        setSubscription(null);
        
        // Notificar servidor
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      } catch (error) {
        console.error('[PWA] Erro ao cancelar inscrição:', error);
      }
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
  };
};
