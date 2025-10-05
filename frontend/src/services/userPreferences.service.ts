import axios from 'axios';

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
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:13000';
  }

  /**
   * Carrega as preferências de indicadores do usuário
   */
  async loadIndicatorPreferences(): Promise<UserIndicatorPreferences | null> {
    try {
      console.log('📦 USER PREFERENCES - Loading preferences from backend');
      
      const response = await axios.get(`${this.baseUrl}/api/user-preferences/indicators`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

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
      
      const response = await axios.post(`${this.baseUrl}/api/user-preferences/indicators`, {
        indicatorConfigs
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        console.log('✅ USER PREFERENCES - Preferences saved to backend successfully');
        return true;
      }

      console.error('❌ USER PREFERENCES - Failed to save preferences to backend');
      return false;

    } catch (error) {
      console.error('❌ USER PREFERENCES - Error saving preferences to backend:', error);
      return false;
    }
  }

  /**
   * Remove as preferências de indicadores do usuário
   */
  async clearIndicatorPreferences(): Promise<boolean> {
    try {
      console.log('🗑️ USER PREFERENCES - Clearing preferences from backend');
      
      const response = await axios.delete(`${this.baseUrl}/api/user-preferences/indicators`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

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
      
      const response = await axios.get(`${this.baseUrl}/api/user-preferences/sync`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Device-ID': deviceId
        }
      });

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
      
      const response = await axios.get(`${this.baseUrl}/api/user-preferences/export`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'text'
      });

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
      
      const response = await axios.post(`${this.baseUrl}/api/user-preferences/import`, {
        jsonData
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
      
      const response = await axios.get(`${this.baseUrl}/api/user-preferences/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

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
