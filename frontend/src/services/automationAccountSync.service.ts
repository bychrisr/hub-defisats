import { indicatorPersistenceService } from './indicatorPersistence.service';

export interface AutomationAccountSyncConfig {
  enabled: boolean;
  syncInterval: number; // em milissegundos
  autoRefresh: boolean;
  crossTabSync: boolean;
  notifications: boolean;
}

export interface AutomationAccountState {
  activeAccountId: string | null;
  defaultAccountId: string | null;
  lastSync: number;
  isOnline: boolean;
  hasChanges: boolean;
}

export interface AutomationAccountEvent {
  type: 'accountChanged' | 'preferencesUpdated' | 'syncStarted' | 'syncCompleted' | 'syncFailed';
  accountId?: string | null;
  timestamp: number;
  data?: any;
}

class AutomationAccountSyncService {
  private readonly STORAGE_KEY = 'hub-defisats-automation-sync';
  private readonly SYNC_INTERVAL = 30000; // 30 segundos
  private readonly MAX_RETRIES = 3;
  
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private retryCount: number = 0;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSync();
    this.setupEventListeners();
  }

  // ===== INICIALIZAÇÃO =====

  private initializeSync(): void {
    console.log('🚀 AUTOMATION SYNC - Initializing automation account sync service');
    
    // Carregar configurações
    const config = this.getSyncConfig();
    if (config.enabled) {
      this.startSync();
    }
  }

  private setupEventListeners(): void {
    // Escutar mudanças de conta ativa
    window.addEventListener('activeAccountChanged', (event: any) => {
      const { accountId } = event.detail;
      this.handleAccountChange(accountId);
    });

    // Escutar mudanças de conta de automação
    window.addEventListener('automationAccountChanged', (event: any) => {
      const { accountId } = event.detail;
      this.handleAutomationAccountChange(accountId);
    });

    // Escutar mudanças de storage (cross-tab)
    window.addEventListener('storage', (event) => {
      if (event.key === 'hub-defisats-indicator-configs') {
        this.handleStorageChange(event);
      }
    });

    // Escutar mudanças de conectividade
    window.addEventListener('online', () => {
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleOnlineStatusChange(false);
    });
  }

  // ===== CONFIGURAÇÃO =====

  public getSyncConfig(): AutomationAccountSyncConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.config || this.getDefaultConfig();
      }
    } catch (error) {
      console.error('❌ AUTOMATION SYNC - Error loading sync config:', error);
    }
    
    return this.getDefaultConfig();
  }

  public updateSyncConfig(config: Partial<AutomationAccountSyncConfig>): boolean {
    try {
      const currentConfig = this.getSyncConfig();
      const newConfig = { ...currentConfig, ...config };
      
      const data = {
        config: newConfig,
        lastUpdated: Date.now()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      
      console.log('✅ AUTOMATION SYNC - Updated sync config:', newConfig);
      
      // Reiniciar sync se necessário
      if (newConfig.enabled && !this.syncInterval) {
        this.startSync();
      } else if (!newConfig.enabled && this.syncInterval) {
        this.stopSync();
      }
      
      return true;
    } catch (error) {
      console.error('❌ AUTOMATION SYNC - Error updating sync config:', error);
      return false;
    }
  }

  private getDefaultConfig(): AutomationAccountSyncConfig {
    return {
      enabled: true,
      syncInterval: this.SYNC_INTERVAL,
      autoRefresh: true,
      crossTabSync: true,
      notifications: true
    };
  }

  // ===== SINCRONIZAÇÃO =====

  public startSync(): void {
    if (this.syncInterval) {
      console.warn('⚠️ AUTOMATION SYNC - Sync already running');
      return;
    }

    const config = this.getSyncConfig();
    if (!config.enabled) {
      console.warn('⚠️ AUTOMATION SYNC - Sync disabled');
      return;
    }

    console.log('🔄 AUTOMATION SYNC - Starting sync service');
    
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, config.syncInterval);

    this.emitEvent('syncStarted', { timestamp: Date.now() });
  }

  public stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ AUTOMATION SYNC - Stopped sync service');
    }
  }

  private async performSync(): Promise<void> {
    try {
      console.log('🔄 AUTOMATION SYNC - Performing sync...');
      
      const state = this.getCurrentState();
      if (!state.hasChanges && !state.isOnline) {
        console.log('⏭️ AUTOMATION SYNC - No changes to sync, skipping');
        return;
      }

      // Sincronizar conta ativa
      const activeAccountId = indicatorPersistenceService.getActiveAccount();
      const automationDefaultAccountId = indicatorPersistenceService.getAutomationDefaultAccount();
      
      // Atualizar estado
      this.updateState({
        activeAccountId,
        defaultAccountId: automationDefaultAccountId,
        lastSync: Date.now(),
        isOnline: navigator.onLine,
        hasChanges: false
      });

      console.log('✅ AUTOMATION SYNC - Sync completed successfully');
      this.emitEvent('syncCompleted', { 
        timestamp: Date.now(),
        activeAccountId,
        automationDefaultAccountId
      });

      this.retryCount = 0;

    } catch (error) {
      console.error('❌ AUTOMATION SYNC - Sync failed:', error);
      this.emitEvent('syncFailed', { 
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      this.retryCount++;
      if (this.retryCount >= this.MAX_RETRIES) {
        console.error('❌ AUTOMATION SYNC - Max retries reached, stopping sync');
        this.stopSync();
      }
    }
  }

  // ===== GERENCIAMENTO DE ESTADO =====

  private getCurrentState(): AutomationAccountState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.state || this.getDefaultState();
      }
    } catch (error) {
      console.error('❌ AUTOMATION SYNC - Error loading state:', error);
    }
    
    return this.getDefaultState();
  }

  private updateState(state: Partial<AutomationAccountState>): void {
    try {
      const currentState = this.getCurrentState();
      const newState = { ...currentState, ...state };
      
      const data = {
        config: this.getSyncConfig(),
        state: newState,
        lastUpdated: Date.now()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      
      console.log('✅ AUTOMATION SYNC - Updated state:', newState);
    } catch (error) {
      console.error('❌ AUTOMATION SYNC - Error updating state:', error);
    }
  }

  private getDefaultState(): AutomationAccountState {
    return {
      activeAccountId: null,
      defaultAccountId: null,
      lastSync: 0,
      isOnline: navigator.onLine,
      hasChanges: false
    };
  }

  // ===== HANDLERS DE EVENTOS =====

  private handleAccountChange(accountId: string | null): void {
    console.log('🔄 AUTOMATION SYNC - Account changed:', accountId);
    
    this.updateState({
      activeAccountId: accountId,
      hasChanges: true
    });

    this.emitEvent('accountChanged', { 
      accountId, 
      timestamp: Date.now() 
    });
  }

  private handleAutomationAccountChange(accountId: string | null): void {
    console.log('🔄 AUTOMATION SYNC - Automation account changed:', accountId);
    
    this.updateState({
      defaultAccountId: accountId,
      hasChanges: true
    });

    this.emitEvent('accountChanged', { 
      accountId, 
      timestamp: Date.now() 
    });
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        const newActiveAccountId = data.userPreferences?.activeAccountId;
        const newAutomationAccountId = data.userPreferences?.automationPreferences?.defaultAccountId;
        
        console.log('🔄 AUTOMATION SYNC - Storage changed from another tab:', {
          activeAccountId: newActiveAccountId,
          automationAccountId: newAutomationAccountId
        });

        this.updateState({
          activeAccountId: newActiveAccountId,
          defaultAccountId: newAutomationAccountId,
          hasChanges: false
        });

        this.emitEvent('accountChanged', { 
          accountId: newActiveAccountId, 
          timestamp: Date.now() 
        });
      } catch (error) {
        console.error('❌ AUTOMATION SYNC - Error parsing storage change:', error);
      }
    }
  }

  private handleOnlineStatusChange(isOnline: boolean): void {
    console.log('🔄 AUTOMATION SYNC - Online status changed:', isOnline);
    
    this.updateState({
      isOnline,
      hasChanges: isOnline // Se voltou online, pode ter mudanças para sincronizar
    });

    if (isOnline && this.getSyncConfig().enabled && !this.syncInterval) {
      this.startSync();
    }
  }

  // ===== SISTEMA DE EVENTOS =====

  public on(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  public off(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(type: string, data: any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ AUTOMATION SYNC - Error in event listener:', error);
        }
      });
    }
  }

  // ===== MÉTODOS PÚBLICOS =====

  public getState(): AutomationAccountState {
    return this.getCurrentState();
  }

  public isSyncRunning(): boolean {
    return this.syncInterval !== null;
  }

  public forceSync(): Promise<void> {
    return this.performSync();
  }

  public destroy(): void {
    this.stopSync();
    this.eventListeners.clear();
    console.log('🧹 AUTOMATION SYNC - Service destroyed');
  }
}

// Instância singleton
export const automationAccountSyncService = new AutomationAccountSyncService();
