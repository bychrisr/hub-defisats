/**
 * Market Data Validator
 * 
 * Validação rigorosa de dados de mercado conforme _VOLATILE_MARKET_SAFETY.md
 * - Valida timestamps (30s market, 5min historical)
 * - Valida estrutura de dados LN Markets
 * - Valida estrutura de dados TradingView
 * - Retorna ValidationResult com detalhes
 */

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  age?: number;
  maxAge?: number;
  missingFields?: string[];
  invalidFields?: string[];
}

export interface MarketData {
  index?: number;
  price?: number;
  change24h?: number;
  changePercent24h?: number;
  timestamp: number;
  tradingFees?: number;
  nextFunding?: string;
  rate?: number;
  rateChange?: number;
}

export interface TradingViewData {
  price: number;
  change24h: number;
  volume?: number;
  timestamp: number;
}

export class MarketDataValidator {
  private static readonly MAX_AGE_MARKET = 30 * 1000; // 30 segundos
  private static readonly MAX_AGE_HISTORICAL = 5 * 60 * 1000; // 5 minutos

  /**
   * Validar dados de mercado (30s máximo)
   */
  static validateMarketData(data: any): ValidationResult {
    console.log('🔍 VALIDATOR - Validating market data:', {
      hasData: !!data,
      hasTimestamp: !!data?.timestamp,
      timestamp: data?.timestamp,
      age: data?.timestamp ? Date.now() - data.timestamp : 'unknown'
    });

    // Validar estrutura básica
    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        reason: 'Invalid data structure'
      };
    }

    // Validar timestamp
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      return {
        valid: false,
        reason: 'Missing or invalid timestamp'
      };
    }

    // Validar idade dos dados
    const age = Date.now() - data.timestamp;
    if (age > this.MAX_AGE_MARKET) {
      console.warn('⚠️ VALIDATOR - Market data too old:', {
        age: age + 'ms',
        maxAge: this.MAX_AGE_MARKET + 'ms',
        timestamp: data.timestamp,
        currentTime: Date.now()
      });
      
      return {
        valid: false,
        reason: `Data too old: ${age}ms > ${this.MAX_AGE_MARKET}ms`,
        age,
        maxAge: this.MAX_AGE_MARKET
      };
    }

    // Validar campos obrigatórios para dados de mercado
    const requiredFields = ['index', 'change24h'];
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null
    );

    if (missingFields.length > 0) {
      return {
        valid: false,
        reason: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      };
    }

    // Validar tipos de campos
    const invalidFields: string[] = [];
    if (typeof data.index !== 'number' || data.index <= 0) {
      invalidFields.push('index');
    }
    if (typeof data.change24h !== 'number') {
      invalidFields.push('change24h');
    }

    if (invalidFields.length > 0) {
      return {
        valid: false,
        reason: `Invalid field types: ${invalidFields.join(', ')}`,
        invalidFields
      };
    }

    console.log('✅ VALIDATOR - Market data valid:', {
      age: age + 'ms',
      index: data.index,
      change24h: data.change24h
    });

    return {
      valid: true,
      reason: 'Market data is valid and recent'
    };
  }

  /**
   * Validar dados históricos (5min máximo)
   */
  static validateHistoricalData(data: any): ValidationResult {
    console.log('🔍 VALIDATOR - Validating historical data:', {
      hasData: !!data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 'not array'
    });

    if (!Array.isArray(data) || data.length === 0) {
      return {
        valid: false,
        reason: 'Invalid historical data structure'
      };
    }

    // Validar cada candle
    for (let i = 0; i < data.length; i++) {
      const candle = data[i];
      
      if (!candle || typeof candle !== 'object') {
        return {
          valid: false,
          reason: `Invalid candle at index ${i}`
        };
      }

      // Validar campos obrigatórios do candle
      const requiredCandleFields = ['time', 'open', 'high', 'low', 'close'];
      const missingFields = requiredCandleFields.filter(field => 
        candle[field] === undefined || candle[field] === null
      );

      if (missingFields.length > 0) {
        return {
          valid: false,
          reason: `Missing candle fields at index ${i}: ${missingFields.join(', ')}`,
          missingFields
        };
      }

      // Validar tipos
      const invalidFields: string[] = [];
      if (typeof candle.time !== 'number' || candle.time <= 0) {
        invalidFields.push('time');
      }
      if (typeof candle.open !== 'number' || candle.open <= 0) {
        invalidFields.push('open');
      }
      if (typeof candle.high !== 'number' || candle.high <= 0) {
        invalidFields.push('high');
      }
      if (typeof candle.low !== 'number' || candle.low <= 0) {
        invalidFields.push('low');
      }
      if (typeof candle.close !== 'number' || candle.close <= 0) {
        invalidFields.push('close');
      }

      if (invalidFields.length > 0) {
        return {
          valid: false,
          reason: `Invalid candle field types at index ${i}: ${invalidFields.join(', ')}`,
          invalidFields
        };
      }
    }

    console.log('✅ VALIDATOR - Historical data valid:', {
      candleCount: data.length,
      firstCandle: data[0],
      lastCandle: data[data.length - 1]
    });

    return {
      valid: true,
      reason: 'Historical data is valid'
    };
  }

  /**
   * Validar dados LN Markets específicos
   */
  static validateLNMarketsData(data: any): ValidationResult {
    console.log('🔍 VALIDATOR - Validating LN Markets data:', {
      hasData: !!data,
      hasTimestamp: !!data?.timestamp,
      fields: data ? Object.keys(data) : []
    });

    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        reason: 'Invalid LN Markets data structure'
      };
    }

    // Validar timestamp
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      return {
        valid: false,
        reason: 'Missing or invalid timestamp'
      };
    }

    // Validar idade (30s para dados de mercado)
    const age = Date.now() - data.timestamp;
    if (age > this.MAX_AGE_MARKET) {
      return {
        valid: false,
        reason: `LN Markets data too old: ${age}ms > ${this.MAX_AGE_MARKET}ms`,
        age,
        maxAge: this.MAX_AGE_MARKET
      };
    }

    // Validar campos específicos LN Markets
    const lnMarketsFields = ['index', 'tradingFees', 'nextFunding', 'rate'];
    const missingFields = lnMarketsFields.filter(field => 
      data[field] === undefined || data[field] === null
    );

    if (missingFields.length > 0) {
      return {
        valid: false,
        reason: `Missing LN Markets fields: ${missingFields.join(', ')}`,
        missingFields
      };
    }

    console.log('✅ VALIDATOR - LN Markets data valid:', {
      age: age + 'ms',
      index: data.index,
      tradingFees: data.tradingFees,
      nextFunding: data.nextFunding,
      rate: data.rate
    });

    return {
      valid: true,
      reason: 'LN Markets data is valid and recent'
    };
  }

  /**
   * Validar dados TradingView
   */
  static validateTradingViewData(data: any): ValidationResult {
    console.log('🔍 VALIDATOR - Validating TradingView data:', {
      hasData: !!data,
      hasTimestamp: !!data?.timestamp,
      fields: data ? Object.keys(data) : []
    });

    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        reason: 'Invalid TradingView data structure'
      };
    }

    // Validar timestamp
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      return {
        valid: false,
        reason: 'Missing or invalid timestamp'
      };
    }

    // Validar idade (30s para dados de mercado)
    const age = Date.now() - data.timestamp;
    if (age > this.MAX_AGE_MARKET) {
      return {
        valid: false,
        reason: `TradingView data too old: ${age}ms > ${this.MAX_AGE_MARKET}ms`,
        age,
        maxAge: this.MAX_AGE_MARKET
      };
    }

    // Validar campos TradingView
    const requiredFields = ['price', 'change24h'];
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null
    );

    if (missingFields.length > 0) {
      return {
        valid: false,
        reason: `Missing TradingView fields: ${missingFields.join(', ')}`,
        missingFields
      };
    }

    console.log('✅ VALIDATOR - TradingView data valid:', {
      age: age + 'ms',
      price: data.price,
      change24h: data.change24h
    });

    return {
      valid: true,
      reason: 'TradingView data is valid and recent'
    };
  }

  /**
   * Validar idade de dados com TTL customizado
   */
  static validateDataAge(data: any, maxAge: number): ValidationResult {
    if (!data || !data.timestamp) {
      return {
        valid: false,
        reason: 'No timestamp to validate'
      };
    }

    const age = Date.now() - data.timestamp;
    if (age > maxAge) {
      return {
        valid: false,
        reason: `Data age ${age}ms exceeds limit ${maxAge}ms`,
        age,
        maxAge
      };
    }

    return {
      valid: true,
      reason: `Data age ${age}ms is within limit ${maxAge}ms`
    };
  }
}
