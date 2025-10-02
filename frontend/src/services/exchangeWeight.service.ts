/**
 * Exchange Weight Service
 * 
 * Distribui requisições entre diferentes exchanges para evitar sobrecarregar a LN Markets API
 * Distribuição: Bitmex 20%, Bybit 30%, Deribit 10%, Binance 40%
 */

export interface ExchangeConfig {
  name: string;
  weight: number;
  baseUrl: string;
  enabled: boolean;
  priority: number; // Menor número = maior prioridade
}

export interface ExchangeWeightResult<T> {
  data: T;
  source: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

class ExchangeWeightService {
  private exchanges: ExchangeConfig[] = [
    {
      name: 'binance',
      weight: 40,
      baseUrl: 'https://api.binance.com',
      enabled: true,
      priority: 1
    },
    {
      name: 'bybit',
      weight: 30,
      baseUrl: 'https://api.bybit.com',
      enabled: true,
      priority: 2
    },
    {
      name: 'bitmex',
      weight: 20,
      baseUrl: 'https://www.bitmex.com',
      enabled: true,
      priority: 3
    },
    {
      name: 'deribit',
      weight: 10,
      baseUrl: 'https://www.deribit.com',
      enabled: true,
      priority: 4
    }
  ];

  private requestCounts: Record<string, number> = {};
  private totalRequests = 0;

  /**
   * Seleciona o exchange baseado no peso e distribuição atual
   */
  private selectExchange(): ExchangeConfig {
    const enabledExchanges = this.exchanges.filter(ex => ex.enabled);
    
    if (enabledExchanges.length === 0) {
      throw new Error('No exchanges enabled');
    }

    // Calcular pesos normalizados
    const totalWeight = enabledExchanges.reduce((sum, ex) => sum + ex.weight, 0);
    const normalizedWeights = enabledExchanges.map(ex => ({
      ...ex,
      normalizedWeight: ex.weight / totalWeight
    }));

    // Calcular distribuição atual
    const currentDistribution = enabledExchanges.map(ex => ({
      ...ex,
      currentRatio: this.requestCounts[ex.name] / Math.max(this.totalRequests, 1)
    }));

    // Encontrar exchange com menor distribuição atual vs peso desejado
    let selectedExchange = enabledExchanges[0];
    let minDeviation = Infinity;

    for (const ex of normalizedWeights) {
      const currentRatio = this.requestCounts[ex.name] / Math.max(this.totalRequests, 1);
      const deviation = Math.abs(currentRatio - ex.normalizedWeight);
      
      if (deviation < minDeviation) {
        minDeviation = deviation;
        selectedExchange = ex;
      }
    }

    return selectedExchange;
  }

  /**
   * Registra uma requisição para o exchange selecionado
   */
  private recordRequest(exchangeName: string): void {
    this.requestCounts[exchangeName] = (this.requestCounts[exchangeName] || 0) + 1;
    this.totalRequests++;
  }

  /**
   * Converte símbolo para formato do exchange
   */
  private convertSymbol(symbol: string, exchange: string): string {
    const symbolUpper = symbol.toUpperCase();
    
    switch (exchange) {
      case 'binance':
        return symbolUpper.includes('USDT') ? symbolUpper : `${symbolUpper}USDT`;
      case 'bybit':
        return symbolUpper.includes('USDT') ? symbolUpper : `${symbolUpper}USDT`;
      case 'bitmex':
        return symbolUpper.includes('USD') ? symbolUpper : `${symbolUpper}USD`;
      case 'deribit':
        return symbolUpper.includes('USD') ? symbolUpper : `${symbolUpper}USD`;
      default:
        return symbolUpper;
    }
  }

  /**
   * Converte timeframe para formato do exchange
   */
  private convertTimeframe(timeframe: string, exchange: string): string {
    const tf = timeframe.toLowerCase();
    
    switch (exchange) {
      case 'binance':
      case 'bybit':
        return tf;
      case 'bitmex':
        return tf.replace('m', 'T').replace('h', 'H').replace('d', 'D');
      case 'deribit':
        return tf.replace('m', 'min').replace('h', 'hour').replace('d', 'day');
      default:
        return tf;
    }
  }

  /**
   * Busca dados históricos usando distribuição de peso entre exchanges
   */
  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    limit: number = 500,
    startTime?: number
  ): Promise<ExchangeWeightResult<CandleData[]>> {
    const exchange = this.selectExchange();
    this.recordRequest(exchange.name);

    try {
      console.log(`🔄 EXCHANGE WEIGHT - Using ${exchange.name} (${exchange.weight}%) for ${symbol} ${timeframe}`);
      
      const convertedSymbol = this.convertSymbol(symbol, exchange.name);
      const convertedTimeframe = this.convertTimeframe(timeframe, exchange.name);
      
      // Timeout de 10 segundos para evitar travamento
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const dataPromise = this.fetchFromExchange(
        exchange, 
        convertedSymbol, 
        convertedTimeframe, 
        limit, 
        startTime
      );

      const data = await Promise.race([dataPromise, timeoutPromise]);

      console.log(`✅ EXCHANGE WEIGHT - Data received from ${exchange.name}:`, {
        symbol: convertedSymbol,
        timeframe: convertedTimeframe,
        count: data.length
      });

      return {
        data,
        source: exchange.name,
        timestamp: Date.now(),
        success: true
      };

    } catch (error: any) {
      console.error(`❌ EXCHANGE WEIGHT - Error with ${exchange.name}:`, error);
      
      // Fallback para Binance se outros exchanges falharem
      if (exchange.name !== 'binance') {
        console.log(`🔄 EXCHANGE WEIGHT - Fallback to Binance`);
        return this.getHistoricalDataFromBinance(symbol, timeframe, limit, startTime);
      }

      return {
        data: [],
        source: exchange.name,
        timestamp: Date.now(),
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Busca dados específicos do Binance (fallback)
   */
  async getHistoricalDataFromBinance(
    symbol: string, 
    timeframe: string, 
    limit: number = 500,
    startTime?: number
  ): Promise<ExchangeWeightResult<CandleData[]>> {
    const binanceExchange = this.exchanges.find(ex => ex.name === 'binance')!;
    this.recordRequest('binance');

    try {
      const convertedSymbol = this.convertSymbol(symbol, 'binance');
      const data = await this.fetchFromExchange(
        binanceExchange, 
        convertedSymbol, 
        timeframe, 
        limit, 
        startTime
      );

      return {
        data,
        source: 'binance',
        timestamp: Date.now(),
        success: true
      };

    } catch (error: any) {
      return {
        data: [],
        source: 'binance',
        timestamp: Date.now(),
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Implementa a busca específica para cada exchange
   */
  private async fetchFromExchange(
    exchange: ExchangeConfig,
    symbol: string,
    timeframe: string,
    limit: number,
    startTime?: number
  ): Promise<CandleData[]> {
    switch (exchange.name) {
      case 'binance':
        return this.fetchFromBinance(symbol, timeframe, limit, startTime);
      case 'bybit':
        return this.fetchFromBybit(symbol, timeframe, limit, startTime);
      case 'bitmex':
        return this.fetchFromBitmex(symbol, timeframe, limit, startTime);
      case 'deribit':
        return this.fetchFromDeribit(symbol, timeframe, limit, startTime);
      default:
        throw new Error(`Unsupported exchange: ${exchange.name}`);
    }
  }

  /**
   * Implementação específica para Binance
   */
  private async fetchFromBinance(
    symbol: string, 
    timeframe: string, 
    limit: number, 
    startTime?: number
  ): Promise<CandleData[]> {
    const params = new URLSearchParams({
      symbol,
      interval: timeframe,
      limit: limit.toString()
    });

    if (startTime) {
      params.append('startTime', startTime.toString());
    }

    const url = `https://api.binance.com/api/v3/klines?${params}`;
    console.log(`🔄 BINANCE - Fetching from: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      console.log(`📊 BINANCE - Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ BINANCE - API error: ${response.status} - ${errorText}`);
        throw new Error(`Binance API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ BINANCE - Data received:`, {
        symbol,
        timeframe,
        count: data.length,
        sample: data.slice(0, 2)
      });
      
      const mappedData = data.map((kline: any[]) => ({
        time: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));

      console.log(`✅ BINANCE - Mapped data:`, {
        count: mappedData.length,
        sample: mappedData.slice(0, 2)
      });

      return mappedData;
    } catch (error: any) {
      console.error(`❌ BINANCE - Fetch error:`, error);
      throw error;
    }
  }

  /**
   * Implementação específica para Bybit
   */
  private async fetchFromBybit(
    symbol: string, 
    timeframe: string, 
    limit: number, 
    startTime?: number
  ): Promise<CandleData[]> {
    const params = new URLSearchParams({
      symbol,
      interval: timeframe,
      limit: limit.toString()
    });

    if (startTime) {
      params.append('from', Math.floor(startTime / 1000).toString());
    }

    const response = await fetch(`https://api.bybit.com/v5/market/kline?${params}`);
    
    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.result || !data.result.list) {
      throw new Error('Invalid Bybit response format');
    }

    return data.result.list.map((kline: any[]) => ({
      time: parseInt(kline[0]),
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5])
    }));
  }

  /**
   * Implementação específica para Bitmex
   */
  private async fetchFromBitmex(
    symbol: string, 
    timeframe: string, 
    limit: number, 
    startTime?: number
  ): Promise<CandleData[]> {
    const params = new URLSearchParams({
      symbol,
      binSize: timeframe,
      count: limit.toString(),
      reverse: 'false'
    });

    if (startTime) {
      params.append('startTime', new Date(startTime).toISOString());
    }

    const response = await fetch(`https://www.bitmex.com/api/v1/trade/bucketed?${params}`);
    
    if (!response.ok) {
      throw new Error(`Bitmex API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.map((bucket: any) => ({
      time: new Date(bucket.timestamp).getTime(),
      open: bucket.open,
      high: bucket.high,
      low: bucket.low,
      close: bucket.close,
      volume: bucket.volume
    }));
  }

  /**
   * Implementação específica para Deribit
   */
  private async fetchFromDeribit(
    symbol: string, 
    timeframe: string, 
    limit: number, 
    startTime?: number
  ): Promise<CandleData[]> {
    const params = new URLSearchParams({
      instrument_name: symbol,
      resolution: timeframe,
      count: limit.toString()
    });

    if (startTime) {
      params.append('start_timestamp', Math.floor(startTime / 1000).toString());
    }

    const response = await fetch(`https://www.deribit.com/api/v2/public/get_tradingview_chart_data?${params}`);
    
    if (!response.ok) {
      throw new Error(`Deribit API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.result || !data.result.trades) {
      throw new Error('Invalid Deribit response format');
    }

    const trades = data.result.trades;
    const volumes = data.result.volume || [];
    
    return trades.map((trade: number, index: number) => ({
      time: trade,
      open: data.result.open[index] || trade,
      high: data.result.high[index] || trade,
      low: data.result.low[index] || trade,
      close: data.result.close[index] || trade,
      volume: volumes[index] || 0
    }));
  }

  /**
   * Obtém estatísticas de distribuição atual
   */
  getDistributionStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const exchange of this.exchanges) {
      const count = this.requestCounts[exchange.name] || 0;
      const percentage = this.totalRequests > 0 ? (count / this.totalRequests) * 100 : 0;
      
      stats[exchange.name] = {
        count,
        percentage: Math.round(percentage * 100) / 100,
        targetWeight: exchange.weight,
        deviation: Math.abs(percentage - exchange.weight)
      };
    }
    
    return {
      totalRequests: this.totalRequests,
      exchanges: stats
    };
  }

  /**
   * Reseta estatísticas de distribuição
   */
  resetStats(): void {
    this.requestCounts = {};
    this.totalRequests = 0;
  }

  /**
   * Habilita/desabilita um exchange
   */
  setExchangeEnabled(exchangeName: string, enabled: boolean): void {
    const exchange = this.exchanges.find(ex => ex.name === exchangeName);
    if (exchange) {
      exchange.enabled = enabled;
    }
  }

  /**
   * Atualiza peso de um exchange
   */
  setExchangeWeight(exchangeName: string, weight: number): void {
    const exchange = this.exchanges.find(ex => ex.name === exchangeName);
    if (exchange) {
      exchange.weight = weight;
    }
  }
}

// Instância singleton
export const exchangeWeightService = new ExchangeWeightService();

// Exportar tipos para uso em outros arquivos
export type { ExchangeConfig, ExchangeWeightResult, CandleData };
