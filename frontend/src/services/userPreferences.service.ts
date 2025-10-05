import { api } from '@/lib/api';

export interface IndicatorConfig {
  enabled: boolean;
  period: number;
  color: string;
  lineWidth: number;
  height?: number;
}

export interface UserIndicatorPreferences {
  userId: string;
  indicatorConfigs: Record<string, IndicatorConfig>;
  lastUpdated: Date;
  version: string;
}

export interface PreferencesStats {
  totalConfigs: number;
  lastUpdated: Date | null;
  version: string | null;
  cacheStatus: 'hit' | 'miss' | 'error';
}

class UserPreferencesService {

  /**
   * Carrega as preferências de indicadores do usuário
   */
  async loadIndicatorPreferences(): Promise<UserIndicatorPreferences | null> {
    try {
      console.log('📦 USER PREFERENCES - Loading preferences from backend');
      
      const response = await api.get('/api/user-preferences/indicators');

      if (response.data.success && response.data.data) {
        console.log('✅ USER PREFERENCES - Preferences loaded from backend:', response.data.data);
        return response.data.data;
      }

      console.log('📦 USER PREFERENCES - No preferences found in backend');
      return null;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error loading preferences from backend:', error);
      return null;
    }
  }

  /**
   * Salva as preferências de indicadores do usuário
   */
  async saveIndicatorPreferences(indicatorConfigs: Record<string, IndicatorConfig>): Promise<boolean> {
    try {
      console.log('💾 USER PREFERENCES - Saving preferences to backend');
      console.log('💾 USER PREFERENCES - Indicator configs to save:', JSON.stringify(indicatorConfigs, null, 2));
      console.log('💾 USER PREFERENCES - Request payload:', JSON.stringify({ indicatorConfigs }, null, 2));
      
      const response = await api.post('/api/user-preferences/indicators', {
        indicatorConfigs
      });

      console.log('💾 USER PREFERENCES - Response status:', response.status);
      console.log('💾 USER PREFERENCES - Response data:', JSON.stringify(response.data, null, 2));
      console.log('💾 USER PREFERENCES - Response headers:', response.headers);

      if (response.data.success) {
        console.log('✅ USER PREFERENCES - Preferences saved to backend successfully');
        return true;
      }

      console.error('❌ USER PREFERENCES - Failed to save preferences to backend');
      console.error('❌ USER PREFERENCES - Response data:', response.data);
      return false;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error saving preferences to backend:', error);
      console.error('❌ USER PREFERENCES - Error response:', error.response?.data);
      console.error('❌ USER PREFERENCES - Error status:', error.response?.status);
      console.error('❌ USER PREFERENCES - Error headers:', error.response?.headers);
      return false;
    }
  }

  /**
   * Remove as preferências de indicadores do usuário
   */
  async clearIndicatorPreferences(): Promise<boolean> {
    try {
      console.log('🗑️ USER PREFERENCES - Clearing preferences from backend');
      
      const response = await api.delete('/api/user-preferences/indicators');

      if (response.data.success) {
        console.log('✅ USER PREFERENCES - Preferences cleared from backend successfully');
        return true;
      }

      console.error('❌ USER PREFERENCES - Failed to clear preferences from backend');
      return false;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error clearing preferences from backend:', error);
      return false;
    }
  }

  /**
   * Sincroniza preferências entre dispositivos
   */
  async syncPreferences(deviceId: string): Promise<UserIndicatorPreferences | null> {
    try {
      console.log('🔄 USER PREFERENCES - Syncing preferences with backend, device:', deviceId);
      
      const response = await api.get(`/api/user-preferences/sync?deviceId=${deviceId}`);

      if (response.data.success && response.data.data) {
        console.log('✅ USER PREFERENCES - Preferences synced from backend:', response.data.data);
        return response.data.data;
      }

      console.log('📦 USER PREFERENCES - No preferences to sync from backend');
      return null;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error syncing preferences from backend:', error);
      return null;
    }
  }

  /**
   * Exporta preferências para backup
   */
  async exportPreferences(): Promise<string | null> {
    try {
      console.log('📤 USER PREFERENCES - Exporting preferences from backend');
      
      const response = await api.get('/api/user-preferences/export');

      if (response.data) {
        console.log('✅ USER PREFERENCES - Preferences exported from backend successfully');
        return response.data;
      }

      console.error('❌ USER PREFERENCES - Failed to export preferences from backend');
      return null;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error exporting preferences from backend:', error);
      return null;
    }
  }

  /**
   * Importa preferências de backup
   */
  async importPreferences(jsonData: string): Promise<boolean> {
    try {
      console.log('📥 USER PREFERENCES - Importing preferences to backend');
      
      const response = await api.post('/api/user-preferences/import', {
        jsonData
      });

      if (response.data.success) {
        console.log('✅ USER PREFERENCES - Preferences imported to backend successfully');
        return true;
      }

      console.error('❌ USER PREFERENCES - Failed to import preferences to backend');
      return false;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error importing preferences to backend:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas das preferências
   */
  async getPreferencesStats(): Promise<PreferencesStats | null> {
    try {
      console.log('📊 USER PREFERENCES - Getting preferences stats from backend');
      
      const response = await api.get('/api/user-preferences/stats');

      if (response.data.success) {
        console.log('✅ USER PREFERENCES - Stats retrieved from backend:', response.data.data);
        return response.data.data;
      }

      console.error('❌ USER PREFERENCES - Failed to get stats from backend');
      return null;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error getting stats from backend:', error);
      return {
        totalConfigs: 0,
        lastUpdated: null,
        version: null,
        cacheStatus: 'error'
      };
    }
  }

  /**
   * Gera um ID único para o dispositivo
   */
  generateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }
}

export const userPreferencesService = new UserPreferencesService();
