import { api } from '@/lib/api';

export type LightweightConfig = {
  symbol: string;
  timeframe: string;
  theme: 'light' | 'dark';
  options?: Record<string, any>;
};

class ChartControlService {
  async getConfig(): Promise<LightweightConfig> {
    const r = await api.get('/api/lightweight/config');
    return r.data.data as LightweightConfig;
  }

  async updateConfig(patch: Partial<LightweightConfig>): Promise<LightweightConfig> {
    const r = await api.put('/api/lightweight/config', patch);
    return r.data.data as LightweightConfig;
  }
}

export const chartControlService = new ChartControlService();


