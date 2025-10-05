// src/services/indicatorManager.service.ts
import { LwcBar, LinePoint, HistogramPoint, MACDResult, BollingerResult } from '@/types/chart';
import { computeRSI, computeEMAFromBars, computeMACD, computeBollinger } from '@/utils/indicators';

// Tipos para indicadores
export type IndicatorType = 'rsi' | 'ema' | 'macd' | 'bollinger' | 'volume';

export interface IndicatorConfig {
  enabled: boolean;
  period?: number;
  color?: string;
  lineWidth?: number;
  height?: number; // Altura do pane em pixels
}

export interface IndicatorResult {
  type: IndicatorType;
  data: LinePoint[] | HistogramPoint[] | MACDResult | BollingerResult;
  config: IndicatorConfig;
  timestamp: number;
  valid: boolean;
}

export interface IndicatorCacheEntry {
  data: IndicatorResult;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// Configurações de cache por tipo de indicador
const CACHE_CONFIG = {
  rsi: { ttl: 300000, maxAge: 300000 }, // 5 minutos - RSI muda pouco
  ema: { ttl: 300000, maxAge: 300000 }, // 5 minutos - EMA muda pouco
  macd: { ttl: 300000, maxAge: 300000 }, // 5 minutos - MACD muda pouco
  bollinger: { ttl: 300000, maxAge: 300000 }, // 5 minutos - Bollinger muda pouco
  volume: { ttl: 30000, maxAge: 30000 }, // 30 segundos - Volume muda mais
} as const;

export class IndicatorManagerService {
  private cache = new Map<string, IndicatorCacheEntry>();
  private readonly maxCacheSize = 100; // Máximo de entradas no cache
  private readonly cleanupInterval = 60000; // Limpeza a cada minuto
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  /**
   * Validação rigorosa de dados de indicadores
   */
  private validateIndicatorData(data: any, type: IndicatorType): boolean {
    if (!data) return false;

    try {
      switch (type) {
        case 'rsi':
          return Array.isArray(data) && data.every(point => 
            point && 
            typeof point.time !== 'undefined' && 
            typeof point.value === 'number' && 
            !isNaN(point.value) &&
            point.value >= 0 && point.value <= 100 // RSI específico
          );

        case 'ema':
          return Array.isArray(data) && data.every(point => 
            point && 
            typeof point.time !== 'undefined' && 
            typeof point.value === 'number' && 
            !isNaN(point.value) &&
            point.value > 0 // EMA pode ter valores altos
          );

        case 'macd':
          const macdData = data as MACDResult;
          return macdData.macdLine && macdData.signalLine && macdData.histogram &&
                 Array.isArray(macdData.macdLine) && Array.isArray(macdData.signalLine) && Array.isArray(macdData.histogram);

        case 'bollinger':
          const bbData = data as BollingerResult;
          return bbData.middle && bbData.upper && bbData.lower &&
                 Array.isArray(bbData.middle) && Array.isArray(bbData.upper) && Array.isArray(bbData.lower);

        case 'volume':
          return Array.isArray(data) && data.every(point => 
            point && 
            typeof point.time !== 'undefined' && 
            typeof point.value === 'number' && 
            !isNaN(point.value) &&
            point.value >= 0
          );

        default:
          return false;
      }
    } catch (error) {
      console.warn(`⚠️ INDICATOR MANAGER - Validation error for ${type}:`, error);
      return false;
    }
  }

  /**
   * Gera chave de cache baseada nos parâmetros
   */
  private generateCacheKey(type: IndicatorType, bars: LwcBar[], config: IndicatorConfig): string {
    const barsHash = bars.length > 0 ? `${bars[0].time}-${bars[bars.length - 1].time}-${bars.length}` : 'empty';
    const configHash = `${type}-${config.period || 'default'}-${config.enabled}`;
    return `${configHash}-${barsHash}`;
  }

  /**
   * Verifica se entrada do cache ainda é válida
   */
  private isCacheValid(entry: IndicatorCacheEntry, type: IndicatorType): boolean {
    const now = Date.now();
    const config = CACHE_CONFIG[type];
    
    // Verificar TTL
    if (now - entry.timestamp > entry.ttl) {
      return false;
    }

    // Verificar idade máxima
    if (now - entry.timestamp > config.maxAge) {
      return false;
    }

    return true;
  }

  /**
   * Calcula indicador com cache inteligente
   */
  async calculateIndicator(
    type: IndicatorType,
    bars: LwcBar[],
    config: IndicatorConfig
  ): Promise<IndicatorResult | null> {
    if (!bars || bars.length === 0) {
      console.warn(`⚠️ INDICATOR MANAGER - No bars provided for ${type}`);
      return null;
    }

    if (!config.enabled) {
      console.log(`📊 INDICATOR MANAGER - ${type} disabled, skipping calculation`);
      return null;
    }

    const cacheKey = this.generateCacheKey(type, bars, config);
    const now = Date.now();

    // Verificar cache primeiro
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && this.isCacheValid(cachedEntry, type)) {
      cachedEntry.accessCount++;
      cachedEntry.lastAccessed = now;
      
      console.log(`📦 INDICATOR MANAGER - Cache hit for ${type}:`, {
        accessCount: cachedEntry.accessCount,
        age: (now - cachedEntry.timestamp) / 1000 + 's',
        ttl: cachedEntry.ttl / 1000 + 's'
      });
      
      return cachedEntry.data;
    }

    // Cache miss - calcular indicador
    console.log(`🔄 INDICATOR MANAGER - Calculating ${type} (cache miss):`, {
      barsCount: bars.length,
      period: config.period,
      enabled: config.enabled
    });

    try {
      let result: IndicatorResult;

      switch (type) {
        case 'rsi':
          const rsiData = computeRSI(bars, config.period || 14);
          result = {
            type: 'rsi',
            data: rsiData,
            config,
            timestamp: now,
            valid: this.validateIndicatorData(rsiData, 'rsi')
          };
          break;

        case 'ema':
          const emaData = computeEMAFromBars(bars, config.period || 20);
          result = {
            type: 'ema',
            data: emaData,
            config,
            timestamp: now,
            valid: this.validateIndicatorData(emaData, 'ema')
          };
          break;

        case 'macd':
          const macdData = computeMACD(bars, 12, 26, 9);
          result = {
            type: 'macd',
            data: macdData,
            config,
            timestamp: now,
            valid: this.validateIndicatorData(macdData, 'macd')
          };
          break;

        case 'bollinger':
          const bbData = computeBollinger(bars, config.period || 20, 2);
          result = {
            type: 'bollinger',
            data: bbData,
            config,
            timestamp: now,
            valid: this.validateIndicatorData(bbData, 'bollinger')
          };
          break;

        case 'volume':
          // Volume é calculado diretamente dos bars
          const volumeData = bars.map(bar => ({
            time: bar.time,
            value: bar.volume || 0,
            color: bar.close > bar.open ? '#26a69a' : '#ef5350'
          }));
          result = {
            type: 'volume',
            data: volumeData,
            config,
            timestamp: now,
            valid: this.validateIndicatorData(volumeData, 'volume')
          };
          break;

        default:
          throw new Error(`Unknown indicator type: ${type}`);
      }

      // Validar resultado
      if (!result.valid) {
        console.warn(`⚠️ INDICATOR MANAGER - Invalid data for ${type}, skipping cache`);
        return null;
      }

      // Armazenar no cache
      const config_ttl = CACHE_CONFIG[type].ttl;
      this.cache.set(cacheKey, {
        data: result,
        timestamp: now,
        ttl: config_ttl,
        accessCount: 1,
        lastAccessed: now
      });

      console.log(`✅ INDICATOR MANAGER - ${type} calculated successfully:`, {
        dataPoints: Array.isArray(result.data) ? result.data.length : 'complex',
        valid: result.valid,
        cached: true
      });

      return result;

    } catch (error) {
      console.error(`❌ INDICATOR MANAGER - Error calculating ${type}:`, error);
      return null;
    }
  }

  /**
   * Calcula múltiplos indicadores em paralelo
   */
  async calculateMultipleIndicators(
    types: IndicatorType[],
    bars: LwcBar[],
    configs: Record<IndicatorType, IndicatorConfig>
  ): Promise<Record<IndicatorType, IndicatorResult | null>> {
    const results: Record<IndicatorType, IndicatorResult | null> = {} as any;

    // Calcular indicadores em paralelo
    const promises = types.map(async (type) => {
      const config = configs[type];
      const result = await this.calculateIndicator(type, bars, config);
      return { type, result };
    });

    try {
      const resolved = await Promise.all(promises);
      
      resolved.forEach(({ type, result }) => {
        results[type] = result;
      });

      console.log(`✅ INDICATOR MANAGER - Multiple indicators calculated:`, {
        types: types.filter(t => results[t] !== null),
        total: types.length,
        successful: Object.values(results).filter(r => r !== null).length
      });

      return results;
    } catch (error) {
      console.error(`❌ INDICATOR MANAGER - Error calculating multiple indicators:`, error);
      return results;
    }
  }

  /**
   * Limpa cache expirado
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const isExpired = now - entry.timestamp > entry.ttl;
      const isOld = now - entry.lastAccessed > entry.ttl * 2; // Não acessado há muito tempo
      
      if (isExpired || isOld) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    // Limitar tamanho do cache
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
      cleanedCount += toRemove.length;
    }

    if (cleanedCount > 0) {
      console.log(`🧹 INDICATOR MANAGER - Cache cleanup: ${cleanedCount} entries removed, ${this.cache.size} remaining`);
    }
  }

  /**
   * Inicia limpeza automática do cache
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Para limpeza automática
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): {
    size: number;
    entries: Array<{
      key: string;
      type: IndicatorType;
      age: number;
      accessCount: number;
      ttl: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 50) + '...',
      type: entry.data.type,
      age: now - entry.timestamp,
      accessCount: entry.accessCount,
      ttl: entry.ttl
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}

// Instância singleton
export const indicatorManager = new IndicatorManagerService();
