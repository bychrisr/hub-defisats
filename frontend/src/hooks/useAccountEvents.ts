import { useEffect, useCallback } from 'react';

// Sistema de eventos customizado para comunicação entre componentes
class AccountEventManager {
  private listeners: Map<string, Set<() => void>> = new Map();

  subscribe(event: string, callback: () => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  unsubscribe(event: string, callback: () => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  emit(event: string) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback());
    }
  }
}

// Instância global do gerenciador de eventos
export const accountEventManager = new AccountEventManager();

// Hook para escutar eventos de conta
export function useAccountEvents(callback?: () => void) {
  const refreshAccounts = useCallback(() => {
    console.log('🔄 ACCOUNT EVENTS - Refreshing accounts due to event...');
    callback?.();
  }, [callback]);

  useEffect(() => {
    accountEventManager.subscribe('accountCreated', refreshAccounts);
    accountEventManager.subscribe('accountUpdated', refreshAccounts);
    accountEventManager.subscribe('accountDeleted', refreshAccounts);
    accountEventManager.subscribe('accountActivated', refreshAccounts);

    return () => {
      accountEventManager.unsubscribe('accountCreated', refreshAccounts);
      accountEventManager.unsubscribe('accountUpdated', refreshAccounts);
      accountEventManager.unsubscribe('accountDeleted', refreshAccounts);
      accountEventManager.unsubscribe('accountActivated', refreshAccounts);
    };
  }, [refreshAccounts]);

  return {
    emitAccountCreated: () => accountEventManager.emit('accountCreated'),
    emitAccountUpdated: () => accountEventManager.emit('accountUpdated'),
    emitAccountDeleted: () => accountEventManager.emit('accountDeleted'),
    emitAccountActivated: () => accountEventManager.emit('accountActivated'),
  };
}
