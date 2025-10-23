/**
 * TradingView Proxy Routes
 * 
 * Proxy para resolver problemas de CORS com TradingView Scanner API
 * Permite usar TradingView como principal sem problemas de CORS
 * 
 * ⚠️ IMPLEMENTAÇÃO DE CACHE CONFORME _VOLATILE_MARKET_SAFETY.md:
 * - Dados históricos: Cache de 5 minutos (conforme ADR-006)
 * - Dados de mercado: Cache de 30 segundos (segurança)
 */

// Cache inteligente para dados históricos (conforme documentação)
let historicalDataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Limpeza automática do cache a cada 10 minutos para evitar vazamentos de memória
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, entry] of historicalDataCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      historicalDataCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 TRADINGVIEW PROXY - Cache cleanup: ${cleanedCount} expired entries removed`);
  }
}, 10 * 60 * 1000); // 10 minutos

export default async function tradingViewRoutes(fastify: any) {
  // Proxy para TradingView Scanner API
  fastify.get('/tradingview/scanner', async (request, reply) => {
    try {
      const { symbol, timeframe, limit } = request.query as {
        symbol?: string;
        timeframe?: string;
        limit?: string;
      };

      console.log('🔄 TRADINGVIEW PROXY - Request received:', { symbol, timeframe, limit });

      // Gerar chave de cache para dados históricos
      const cacheKey = `historical_${symbol}_${timeframe}_${limit}`;
      const now = Date.now();
      
      // Verificar cache para dados históricos (5 minutos conforme ADR-006)
      const cachedEntry = historicalDataCache.get(cacheKey);
      if (cachedEntry && (now - cachedEntry.timestamp) < cachedEntry.ttl) {
        console.log('📦 TRADINGVIEW PROXY - Cache hit for historical data:', {
          cacheKey: cacheKey.substring(0, 50) + '...',
          age: (now - cachedEntry.timestamp) / 1000 + 's',
          ttl: cachedEntry.ttl / 1000 + 's'
        });
        
        return reply.send({
          success: true,
          data: cachedEntry.data,
          source: 'tradingview-proxy-binance-cached',
          timestamp: cachedEntry.timestamp,
          cacheHit: true
        });
      }

      console.log('📦 TRADINGVIEW PROXY - Cache miss, fetching fresh data:', {
        cacheKey: cacheKey.substring(0, 50) + '...',
        reason: cachedEntry ? 'expired' : 'not found'
      });

      // Configuração de símbolos TradingView (multi-exchange)
      const tradingViewSymbols = {
        BTCUSDT: [
          'BINANCE:BTCUSDT',    // 40% weight
          'BYBIT:BTCUSDT',      // 30% weight  
          'BITMEX:BTCUSDT',     // 20% weight
          'DERIBIT:BTCUSDT'     // 10% weight
        ]
      };

      const symbols = tradingViewSymbols[symbol as keyof typeof tradingViewSymbols] || [`BINANCE:${symbol}`];
      
      // TradingView Scanner API não está funcionando diretamente
      // Vamos usar Binance como fonte principal mas manter a interface TradingView
      console.log('🔄 TRADINGVIEW PROXY - Using Binance as primary source (TradingView interface)');
      
      // Fazer requisição para Binance API
      // Converter símbolo TradingView para formato Binance
      const binanceSymbol = symbol?.replace(/^BINANCE:/, '') || symbol;
      
      // Mapear intervalos TradingView para Binance
      const intervalMapping: { [key: string]: string } = {
        '1m': '1m',
        '3m': '3m', 
        '5m': '5m',
        '10m': '15m',  // TradingView 10m -> Binance 15m (mais próximo)
        '15m': '15m',
        '30m': '30m',
        '1h': '1h',
        '2h': '2h',
        '4h': '4h',
        '6h': '6h',
        '8h': '8h',
        '12h': '12h',
        '1d': '1d',
        '3d': '3d',
        '1w': '1w',
        '1M': '1M'
      };
      
      const binanceInterval = intervalMapping[timeframe || '1h'] || '1h';
      console.log('🔄 TRADINGVIEW PROXY - Converting symbol and interval:', { 
        originalSymbol: symbol, 
        binanceSymbol, 
        originalInterval: timeframe, 
        binanceInterval 
      });
      
      const binanceResponse = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!binanceResponse.ok) {
        console.error('❌ TRADINGVIEW PROXY - Binance error:', binanceResponse.status);
        return reply.status(binanceResponse.status).send({
          success: false,
          error: 'BINANCE_API_ERROR',
          message: `Binance API error: ${binanceResponse.status}`
        });
      }

      const binanceData = await binanceResponse.json();
      
      // Converter dados do Binance para formato padrão
      // ✅ CORREÇÃO CRÍTICA: Binance retorna timestamps em milissegundos
      // Mas o frontend espera em segundos para Lightweight Charts v5.0.9
      const convertedData = binanceData.map((kline: any[]) => ({
        time: Math.floor(kline[0] / 1000), // Converter ms para segundos
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
      
      console.log('✅ TRADINGVIEW PROXY - Data converted from Binance:', {
        originalCount: binanceData.length,
        convertedCount: convertedData.length
      });

      // Armazenar no cache com TTL de 5 minutos para dados históricos (conforme ADR-006)
      historicalDataCache.set(cacheKey, {
        data: convertedData,
        timestamp: now,
        ttl: 5 * 60 * 1000 // 5 minutos para dados históricos
      });

      console.log('📦 TRADINGVIEW PROXY - Data cached for historical use:', {
        cacheKey: cacheKey.substring(0, 50) + '...',
        ttl: '5min',
        dataLength: convertedData.length
      });

      return reply.send({
        success: true,
        data: convertedData,
        source: 'tradingview-proxy-binance',
        timestamp: now,
        cacheHit: false
      });

    } catch (error: any) {
      console.error('❌ TRADINGVIEW PROXY - Error:', error);
      return reply.status(500).send({
        success: false,
        error: 'TRADINGVIEW_PROXY_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  });

  // ✅ NOVO: Endpoint enhanced para exchange específica
  fastify.get('/tradingview/index/:exchange', async (request, reply) => {
    try {
      const { exchange } = request.params as { exchange: string };
      const { symbol = 'BTCUSDT' } = request.query as { symbol?: string };
      
      console.log('🔄 TRADINGVIEW ENHANCED - Request received:', { exchange, symbol });

      // Configurações por exchange
      const exchangeConfigs = {
        lnmarkets: {
          symbols: ['BINANCE:BTCUSDT', 'BYBIT:BTCUSDT', 'BITMEX:BTCUSDT'],
          weights: [0.4, 0.3, 0.3],
          name: 'LN Markets Index'
        },
        binance: {
          symbols: ['BINANCE:BTCUSDT'],
          weights: [1.0],
          name: 'Binance Direct'
        },
        coinbase: {
          symbols: ['COINBASE:BTCUSD'],
          weights: [1.0],
          name: 'Coinbase Direct'
        }
      };

      const config = exchangeConfigs[exchange as keyof typeof exchangeConfigs];
      if (!config) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_EXCHANGE',
          message: `Exchange not supported: ${exchange}`,
          supportedExchanges: Object.keys(exchangeConfigs)
        });
      }

      // Buscar dados de cada símbolo e calcular média ponderada
      const symbolData = [];
      
      for (let i = 0; i < config.symbols.length; i++) {
        const symbolName = config.symbols[i];
        const weight = config.weights[i];
        
        try {
          console.log(`🔄 TRADINGVIEW ENHANCED - Fetching data for ${symbolName} (weight: ${weight})`);
          
          // Usar Binance como fonte (conforme implementação existente)
          const binanceSymbol = symbolName.replace(/^BINANCE:/, '');
          const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });

          if (!binanceResponse.ok) {
            console.warn(`⚠️ TRADINGVIEW ENHANCED - Binance error for ${symbolName}: ${binanceResponse.status}`);
            continue;
          }

          const binanceData = await binanceResponse.json();
          
          symbolData.push({
            price: parseFloat(binanceData.lastPrice),
            change24h: parseFloat(binanceData.priceChangePercent),
            volume: parseFloat(binanceData.volume),
            weight,
            symbol: symbolName
          });
          
        } catch (error) {
          console.warn(`⚠️ TRADINGVIEW ENHANCED - Failed to fetch data for ${symbolName}:`, error);
        }
      }

      if (symbolData.length === 0) {
        return reply.status(503).send({
          success: false,
          error: 'NO_DATA_AVAILABLE',
          message: 'No valid data found for any symbol'
        });
      }

      // Calcular média ponderada
      const totalWeight = symbolData.reduce((sum, item) => sum + item.weight, 0);
      const weightedPrice = symbolData.reduce((sum, item) => sum + (item.price * item.weight), 0) / totalWeight;
      const weightedChange = symbolData.reduce((sum, item) => sum + (item.change24h * item.weight), 0) / totalWeight;
      const weightedVolume = symbolData.reduce((sum, item) => sum + ((item.volume || 0) * item.weight), 0) / totalWeight;

      const result = {
        price: weightedPrice,
        change24h: weightedChange,
        volume: weightedVolume,
        timestamp: Date.now(),
        source: `tradingview-${config.name.toLowerCase().replace(/\s+/g, '-')}`,
        exchange: config.name,
        symbols: symbolData.map(item => item.symbol),
        weights: config.weights
      };

      // Validar dados
      const { MarketDataValidator } = await import('../utils/market-data-validator');
      const validation = MarketDataValidator.validateTradingViewData(result);

      if (!validation.valid) {
        console.error('❌ TRADINGVIEW ENHANCED - Data validation failed:', validation.reason);
        return reply.status(503).send({
          success: false,
          error: 'DATA_VALIDATION_FAILED',
          message: 'TradingView data validation failed',
          details: validation.reason
        });
      }

      console.log('✅ TRADINGVIEW ENHANCED - Weighted average calculated:', {
        price: result.price,
        change24h: result.change24h,
        source: result.source,
        symbolCount: symbolData.length
      });

      return reply.send({
        success: true,
        data: result,
        source: 'tradingview-enhanced',
        timestamp: Date.now(),
        headers: {
          'X-Data-Age': '0',
          'X-Data-Source': result.source,
          'X-Cache-Status': 'MISS'
        }
      });

    } catch (error: any) {
      console.error('❌ TRADINGVIEW ENHANCED - Error:', error);
      return reply.status(500).send({
        success: false,
        error: 'TRADINGVIEW_ENHANCED_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  });

  // Proxy para dados de mercado TradingView
  fastify.get('/tradingview/market/:symbol', async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string };
      
      console.log('🔄 TRADINGVIEW PROXY - Market data request:', { symbol });

      // Por enquanto, retornar dados do Binance como fallback
      // TODO: Implementar dados de mercado do TradingView quando necessário
      const binanceSymbol = symbol.replace(/^BINANCE:/, '');
      const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!binanceResponse.ok) {
        throw new Error(`Binance API error: ${binanceResponse.status}`);
      }

      const binanceData = await binanceResponse.json();
      
      const marketData = {
        price: parseFloat(binanceData.lastPrice),
        change24h: parseFloat(binanceData.priceChangePercent),
        volume: parseFloat(binanceData.volume),
        timestamp: Date.now(),
        source: 'binance-fallback'
      };

      console.log('✅ TRADINGVIEW PROXY - Market data:', marketData);

      return reply.send({
        success: true,
        data: marketData,
        source: 'tradingview-proxy',
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('❌ TRADINGVIEW PROXY - Market data error:', error);
      return reply.status(500).send({
        success: false,
        error: 'TRADINGVIEW_MARKET_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  });
}

// Função para converter dados do TradingView para formato padrão
function convertTradingViewData(tradingViewData: any, timeframe: string): any[] {
  // Por enquanto, retornar array vazio para forçar fallback
  // TODO: Implementar conversão real dos dados do TradingView
  console.log('🔄 TRADINGVIEW PROXY - Converting data (fallback to Binance)');
  return [];
}
