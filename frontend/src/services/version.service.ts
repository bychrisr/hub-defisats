interface VersionInfo {
  version: string;
  buildTime: string;
  environment: string;
  features: string[];
}

interface VersionCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  buildTime: string;
  features: string[];
}

class VersionService {
  private currentVersion: string | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
  private readonly STORAGE_KEY = 'app_version_info';
  private readonly VERSION_KEY = 'app_current_version';

  constructor() {
    this.initializeVersion();
  }

  private initializeVersion() {
    // Tenta obter a versão atual do package.json ou define uma versão padrão
    try {
      // Em produção, isso seria injetado pelo build process
      this.currentVersion = process.env.REACT_APP_VERSION || '1.0.0';
    } catch (error) {
      this.currentVersion = '1.0.0';
    }
  }

  /**
   * Inicia a verificação periódica de versão
   */
  startVersionCheck(): void {
    console.log('🔄 VERSION SERVICE - Starting periodic version check');
    
    // Verifica imediatamente
    this.checkForUpdates();
    
    // Configura verificação periódica
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Para a verificação periódica de versão
   */
  stopVersionCheck(): void {
    console.log('⏹️ VERSION SERVICE - Stopping version check');
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Verifica se há uma nova versão disponível
   */
  async checkForUpdates(): Promise<VersionCheckResult> {
    try {
      console.log('🔍 VERSION SERVICE - Checking for updates...');
      
      const response = await fetch('/api/version', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const versionInfo: VersionInfo = await response.json();
      console.log('📦 VERSION SERVICE - Server version info:', versionInfo);

      const hasUpdate = this.compareVersions(this.currentVersion!, versionInfo.version);
      
      const result: VersionCheckResult = {
        hasUpdate,
        currentVersion: this.currentVersion!,
        latestVersion: versionInfo.version,
        buildTime: versionInfo.buildTime,
        features: versionInfo.features
      };

      // Salva informações da versão no localStorage
      this.saveVersionInfo(result);

      if (hasUpdate) {
        console.log('🆕 VERSION SERVICE - New version available!', {
          current: this.currentVersion,
          latest: versionInfo.version,
          buildTime: versionInfo.buildTime
        });
      } else {
        console.log('✅ VERSION SERVICE - App is up to date');
      }

      return result;
    } catch (error) {
      console.error('❌ VERSION SERVICE - Error checking for updates:', error);
      
      // Retorna resultado sem atualização em caso de erro
      return {
        hasUpdate: false,
        currentVersion: this.currentVersion!,
        latestVersion: this.currentVersion!,
        buildTime: new Date().toISOString(),
        features: []
      };
    }
  }

  /**
   * Compara duas versões e retorna true se a segunda for mais recente
   */
  private compareVersions(current: string, latest: string): boolean {
    if (current === latest) return false;

    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    // Garante que ambas as versões tenham o mesmo número de partes
    const maxLength = Math.max(currentParts.length, latestParts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  }

  /**
   * Salva informações da versão no localStorage
   */
  private saveVersionInfo(versionInfo: VersionCheckResult): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versionInfo));
      localStorage.setItem(this.VERSION_KEY, versionInfo.latestVersion);
    } catch (error) {
      console.warn('⚠️ VERSION SERVICE - Could not save version info to localStorage:', error);
    }
  }

  /**
   * Obtém informações da versão salvas no localStorage
   */
  getStoredVersionInfo(): VersionCheckResult | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('⚠️ VERSION SERVICE - Could not read version info from localStorage:', error);
      return null;
    }
  }

  /**
   * Força uma verificação de versão
   */
  async forceCheck(): Promise<VersionCheckResult> {
    console.log('🔄 VERSION SERVICE - Force checking for updates...');
    return this.checkForUpdates();
  }

  /**
   * Obtém a versão atual da aplicação
   */
  getCurrentVersion(): string {
    return this.currentVersion || '1.0.0';
  }

  /**
   * Verifica se o usuário já foi notificado sobre esta versão
   */
  hasBeenNotified(version: string): boolean {
    try {
      const notifiedVersions = JSON.parse(localStorage.getItem('notified_versions') || '[]');
      return notifiedVersions.includes(version);
    } catch (error) {
      return false;
    }
  }

  /**
   * Marca uma versão como notificada
   */
  markAsNotified(version: string): void {
    try {
      const notifiedVersions = JSON.parse(localStorage.getItem('notified_versions') || '[]');
      if (!notifiedVersions.includes(version)) {
        notifiedVersions.push(version);
        localStorage.setItem('notified_versions', JSON.stringify(notifiedVersions));
      }
    } catch (error) {
      console.warn('⚠️ VERSION SERVICE - Could not mark version as notified:', error);
    }
  }
}

// Instância singleton
export const versionService = new VersionService();
export type { VersionInfo, VersionCheckResult };
