// src/services/emaCalculation.service.ts
import { EMAPoint, EMACalculationOptions, EMAValidationResult } from '@/types/emaIndicator';

export interface BarData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export class EMACalculationService {
  /**
   * Calcula a EMA (Exponential Moving Average) de forma isolada e correta
   * @param data Array de dados de preço
   * @param options Opções de cálculo
   * @returns Array de pontos da EMA
   */
  static calculateEMA(
    data: BarData[], 
    options: EMACalculationOptions
  ): EMAPoint[] {
    console.log(`📊 EMA CALCULATION - Starting EMA calculation`);
    console.log(`📊 EMA CALCULATION - Data points: ${data.length}, Period: ${options.period}`);
    
    // Validação inicial
    if (!data || data.length === 0) {
      console.warn('⚠️ EMA CALCULATION - No data provided');
      return [];
    }
    
    if (data.length < options.period) {
      console.warn(`⚠️ EMA CALCULATION - Insufficient data: ${data.length} < ${options.period}`);
      return [];
    }
    
    // Fator de suavização (smoothing factor)
    const smoothingFactor = options.smoothingFactor || (2 / (options.period + 1));
    console.log(`📊 EMA CALCULATION - Smoothing factor: ${smoothingFactor}`);
    
    // Extrair preços de fechamento
    const closes = data.map(bar => bar.close);
    
    // Primeira EMA = SMA dos primeiros 'period' valores
    let sum = 0;
    for (let i = 0; i < options.period; i++) {
      sum += closes[i];
    }
    let previousEMA = sum / options.period;
    
    console.log(`📊 EMA CALCULATION - Initial SMA: ${previousEMA}`);
    
    const result: EMAPoint[] = [];
    
    // Primeiro ponto da EMA (alinhado com o período)
    result.push({
      time: data[options.period - 1].time,
      value: previousEMA
    });
    
    // Calcular EMA para os pontos restantes usando a fórmula: EMA = (Price - PreviousEMA) * SmoothingFactor + PreviousEMA
    for (let i = options.period; i < data.length; i++) {
      const currentPrice = closes[i];
      const ema = (currentPrice - previousEMA) * smoothingFactor + previousEMA;
      
      result.push({
        time: data[i].time,
        value: ema
      });
      
      previousEMA = ema;
    }
    
    console.log(`✅ EMA CALCULATION - EMA calculation completed: ${result.length} points`);
    console.log(`📊 EMA CALCULATION - First EMA value: ${result[0]?.value}`);
    console.log(`📊 EMA CALCULATION - Last EMA value: ${result[result.length - 1]?.value}`);
    
    return result;
  }
  
  /**
   * Valida os dados de entrada para cálculo da EMA
   * @param data Dados de entrada
   * @param period Período da EMA
   * @returns Resultado da validação
   */
  static validateData(data: BarData[], period: number): EMAValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!data || data.length === 0) {
      errors.push('No data provided');
      return { isValid: false, errors, warnings };
    }
    
    if (data.length < period) {
      errors.push(`Insufficient data: ${data.length} points, need at least ${period}`);
    }
    
    // Verificar se todos os dados têm preços válidos
    for (let i = 0; i < data.length; i++) {
      const bar = data[i];
      if (!bar || typeof bar.close !== 'number' || isNaN(bar.close) || bar.close <= 0) {
        errors.push(`Invalid price data at index ${i}: ${bar?.close}`);
        break;
      }
      if (!bar.time || typeof bar.time !== 'number') {
        errors.push(`Invalid time data at index ${i}: ${bar?.time}`);
        break;
      }
    }
    
    // Verificar se há dados suficientes para cálculo
    if (data.length < period * 2) {
      warnings.push(`Limited data for EMA calculation: ${data.length} points for period ${period}`);
    }
    
    const isValid = errors.length === 0;
    console.log(`📊 EMA VALIDATION - Valid: ${isValid}, Errors: ${errors.length}, Warnings: ${warnings.length}`);
    
    return { isValid, errors, warnings };
  }
  
  /**
   * Calcula estatísticas da EMA
   * @param emaData Dados da EMA
   * @returns Estatísticas calculadas
   */
  static calculateStats(emaData: EMAPoint[]): {
    dataPoints: number;
    firstValue: number | null;
    lastValue: number | null;
    minValue: number | null;
    maxValue: number | null;
    averageValue: number | null;
  } {
    if (!emaData || emaData.length === 0) {
      return {
        dataPoints: 0,
        firstValue: null,
        lastValue: null,
        minValue: null,
        maxValue: null,
        averageValue: null
      };
    }
    
    const values = emaData.map(point => point.value);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      dataPoints: emaData.length,
      firstValue: emaData[0]?.value || null,
      lastValue: emaData[emaData.length - 1]?.value || null,
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      averageValue: sum / values.length
    };
  }
  
  /**
   * Testa a implementação da EMA com dados conhecidos
   * @returns true se o teste passou
   */
  static testImplementation(): boolean {
    console.log('🧪 EMA TEST - Testing EMA implementation');
    
    // Dados de teste conhecidos
    const testData: BarData[] = [
      { time: 1, open: 100, high: 105, low: 95, close: 102 },
      { time: 2, open: 102, high: 108, low: 100, close: 106 },
      { time: 3, open: 106, high: 110, low: 104, close: 108 },
      { time: 4, open: 108, high: 112, low: 106, close: 110 },
      { time: 5, open: 110, high: 115, low: 108, close: 113 }
    ];
    
    const result = this.calculateEMA(testData, { period: 3 });
    
    if (result.length !== 3) {
      console.error('❌ EMA TEST - Expected 3 points, got', result.length);
      return false;
    }
    
    // Verificar se os valores são razoáveis
    const firstEMA = result[0].value;
    const expectedFirst = (102 + 106 + 108) / 3; // SMA dos primeiros 3
    
    if (Math.abs(firstEMA - expectedFirst) > 0.01) {
      console.error('❌ EMA TEST - First EMA value incorrect:', firstEMA, 'expected:', expectedFirst);
      return false;
    }
    
    console.log('✅ EMA TEST - EMA implementation test passed');
    return true;
  }
}

export default EMACalculationService;
