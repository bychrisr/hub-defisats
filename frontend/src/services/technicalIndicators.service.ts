/**
 * Serviço de Indicadores Técnicos
 * Implementa cálculos de indicadores técnicos para análise de mercado
 */

export interface RSIConfig {
  period: number;
  overbought: number;
  oversold: number;
}

export interface RSIDataPoint {
  time: number;
  value: number;
  signal?: 'overbought' | 'oversold' | 'neutral';
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class TechnicalIndicatorsService {
  /**
   * Calcula o RSI (Relative Strength Index)
   * @param data Array de dados de candlestick
   * @param config Configuração do RSI
   * @returns Array com pontos do RSI
   */
  static calculateRSI(data: CandleData[], config: RSIConfig = { period: 14, overbought: 70, oversold: 30 }): RSIDataPoint[] {
    if (data.length < config.period + 1) {
      return [];
    }

    const rsiData: RSIDataPoint[] = [];
    
    // Calcular mudanças de preço
    const priceChanges: number[] = [];
    for (let i = 1; i < data.length; i++) {
      priceChanges.push(data[i].close - data[i - 1].close);
    }

    // Calcular ganhos e perdas médios
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (const change of priceChanges) {
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calcular RSI para cada ponto
    for (let i = config.period; i < gains.length; i++) {
      // Calcular ganhos e perdas médios para o período
      const avgGain = gains.slice(i - config.period + 1, i + 1).reduce((sum, gain) => sum + gain, 0) / config.period;
      const avgLoss = losses.slice(i - config.period + 1, i + 1).reduce((sum, loss) => sum + loss, 0) / config.period;

      // Calcular RS e RSI
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));

      // Determinar sinal
      let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
      if (rsi >= config.overbought) {
        signal = 'overbought';
      } else if (rsi <= config.oversold) {
        signal = 'oversold';
      }

      rsiData.push({
        time: data[i + 1].time, // +1 porque começamos do índice 1
        value: rsi,
        signal
      });
    }

    return rsiData;
  }

  /**
   * Calcula RSI com suavização exponencial (mais preciso)
   * @param data Array de dados de candlestick
   * @param config Configuração do RSI
   * @returns Array com pontos do RSI suavizado
   */
  static calculateRSIExponential(data: CandleData[], config: RSIConfig = { period: 14, overbought: 70, oversold: 30 }): RSIDataPoint[] {
    if (data.length < config.period + 1) {
      return [];
    }

    const rsiData: RSIDataPoint[] = [];
    
    // Calcular mudanças de preço
    const priceChanges: number[] = [];
    for (let i = 1; i < data.length; i++) {
      priceChanges.push(data[i].close - data[i - 1].close);
    }

    // Calcular ganhos e perdas
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (const change of priceChanges) {
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calcular médias exponenciais
    const alpha = 1 / config.period;
    let avgGain = gains.slice(0, config.period).reduce((sum, gain) => sum + gain, 0) / config.period;
    let avgLoss = losses.slice(0, config.period).reduce((sum, loss) => sum + loss, 0) / config.period;

    // Primeiro ponto RSI
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
    if (rsi >= config.overbought) {
      signal = 'overbought';
    } else if (rsi <= config.oversold) {
      signal = 'oversold';
    }

    rsiData.push({
      time: data[config.period].time,
      value: rsi,
      signal
    });

    // Calcular pontos subsequentes com suavização exponencial
    for (let i = config.period; i < gains.length; i++) {
      avgGain = alpha * gains[i] + (1 - alpha) * avgGain;
      avgLoss = alpha * losses[i] + (1 - alpha) * avgLoss;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));

      let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
      if (rsi >= config.overbought) {
        signal = 'overbought';
      } else if (rsi <= config.oversold) {
        signal = 'oversold';
      }

      rsiData.push({
        time: data[i + 1].time,
        value: rsi,
        signal
      });
    }

    return rsiData;
  }

  /**
   * Valida configuração do RSI
   * @param config Configuração a ser validada
   * @returns Configuração válida
   */
  static validateRSIConfig(config: Partial<RSIConfig>): RSIConfig {
    return {
      period: Math.max(2, Math.min(50, config.period || 14)),
      overbought: Math.max(60, Math.min(90, config.overbought || 70)),
      oversold: Math.max(10, Math.min(40, config.oversold || 30))
    };
  }

  /**
   * Calcula estatísticas do RSI
   * @param rsiData Dados do RSI
   * @returns Estatísticas calculadas
   */
  static calculateRSIStats(rsiData: RSIDataPoint[]) {
    if (rsiData.length === 0) {
      return {
        min: 0,
        max: 100,
        avg: 50,
        overboughtCount: 0,
        oversoldCount: 0,
        neutralCount: 0
      };
    }

    const values = rsiData.map(point => point.value);
    const signals = rsiData.map(point => point.signal);

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      overboughtCount: signals.filter(s => s === 'overbought').length,
      oversoldCount: signals.filter(s => s === 'oversold').length,
      neutralCount: signals.filter(s => s === 'neutral').length
    };
  }
}

export default TechnicalIndicatorsService;
