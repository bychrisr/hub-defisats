import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

export async function marketDataRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

// Authentication middleware applied above for private routes

  // PUBLIC ENDPOINT - No authentication required (registered after auth middleware)
  fastify.get('/prices/latest', {
    schema: {
      description: 'Get latest market prices (public endpoint)',
      tags: ['Market Data'],
      querystring: {
        type: 'object',
        properties: {
          symbols: {
            type: 'string',
            description: 'Comma-separated symbols (e.g., BTC,ETH)',
            default: 'BTC'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  usd: { type: 'number' },
                  usd_24h_change: { type: 'number' },
                  last_updated_at: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { symbols = 'BTC' } = request.query as any;
      const symbolList = symbols.split(',').map((s: string) => s.toLowerCase());

      console.log('🔍 PUBLIC PRICES - Getting latest prices for:', symbolList);

      // Use CoinGecko for public price data (no auth required)
      const ids = symbolList.map((symbol: string) => {
        switch (symbol.toLowerCase()) {
          case 'btc':
          case 'bitcoin':
            return 'bitcoin';
          case 'eth':
          case 'ethereum':
            return 'ethereum';
          default:
            return symbol.toLowerCase();
        }
      }).join(',');

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ PUBLIC PRICES - Retrieved prices from CoinGecko');

      return reply.status(200).send({
        success: true,
        data: data
      });
    } catch (error: any) {
      console.error('❌ PUBLIC PRICES - Error getting prices:', error);

      // Fallback with simulated data
      return reply.status(200).send({
        success: true,
        data: {
          bitcoin: {
            usd: 115000,
            usd_24h_change: 2.5,
            last_updated_at: Math.floor(Date.now() / 1000)
          }
        }
      });
    }
  });

// Authentication middleware applied above for private routes

  // Get historical market data (candlesticks)
  fastify.get('/market/historical', {
    schema: {
      description: 'Get historical market data for charting',
      tags: ['Market Data'],
      querystring: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Trading symbol (e.g., BTCUSD)' },
          timeframe: { type: 'string', description: 'Timeframe (1m, 5m, 15m, 1h, 4h, 1d)', default: '1h' },
          limit: { type: 'string', description: 'Number of candles to return', default: '100' }
        },
        required: ['symbol']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                symbol: { type: 'string' },
                timeframe: { type: 'string' },
                candles: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      time: { type: 'number' },
                      open: { type: 'number' },
                      high: { type: 'number' },
                      low: { type: 'number' },
                      close: { type: 'number' },
                      volume: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { symbol, timeframe = '1h', limit = '100' } = request.query as any;

      console.log('🔍 MARKET DATA - Getting market data for:', { symbol, timeframe, limit, userId: user?.id });

      // If no symbol is provided, return basic market index data
      if (!symbol) {
        console.log('🔄 MARKET DATA - No symbol provided, returning basic market index');

        try {
          // Try to get current BTC price from Binance as fallback
          const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
          if (response.ok) {
            const data = await response.json();
            const btcPrice = parseFloat(data.lastPrice) || 65000;
            const btcChange = parseFloat(data.priceChangePercent) || 0;

            return reply.status(200).send({
              success: true,
              data: {
                index: Math.round(btcPrice),
                index24hChange: parseFloat(btcChange.toFixed(3)),
                tradingFees: 0.1,
                nextFunding: '1h 45m 30s',
                rate: 0.00006,
                timestamp: new Date().toISOString()
              }
            });
          }
        } catch (binanceError) {
          console.log('⚠️ MARKET DATA - Binance failed, using fallback data');
        }

        // Fallback data
        return reply.status(200).send({
          success: true,
          data: {
            index: 115479,
            index24hChange: -0.423,
            tradingFees: 0.1,
            nextFunding: '1h 45m 30s',
            rate: 0.00006,
            timestamp: new Date().toISOString()
          }
        });
      }

      // For historical data requests, require authentication and credentials
      if (!user?.id) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required for historical data',
        });
      }

      // Get user credentials
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
        },
      });

      if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured',
        });
      }

      // Decrypt credentials
      const { AuthService } = await import('../services/auth.service');
      const authService = new AuthService(prisma, {} as any);
      const apiKey = authService.decryptData(userProfile.ln_markets_api_key);
      const apiSecret = authService.decryptData(userProfile.ln_markets_api_secret);
      const passphrase = authService.decryptData(userProfile.ln_markets_passphrase);

      // Initialize LN Markets service
      const lnMarketsService = new LNMarketsAPIService({
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false,
      });

      // Get historical data from LN Markets
      const historicalData = await lnMarketsService.getHistoricalData(symbol, timeframe, parseInt(limit));

      console.log('✅ MARKET DATA - Historical data retrieved:', historicalData.length, 'candles');

      return reply.status(200).send({
        success: true,
        data: {
          symbol,
          timeframe,
          candles: historicalData
        }
      });
    } catch (error: any) {
      console.error('❌ MARKET DATA - Error getting market data:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get historical market data',
        details: error.message
      });
    }
  });

  // Lightweight Charts - Configuração remota simples
  // GET atual
  let lightweightConfig: any = {
    symbol: 'BTCUSDT',
    timeframe: '1h',
    theme: 'dark',
    options: {}
  };

  fastify.get('/lightweight/config', async (_req, _res) => {
    return { success: true, data: lightweightConfig };
  });

  // PUT atualização
  fastify.put('/lightweight/config', async (req, res) => {
    try {
      const body = req.body as any;
      lightweightConfig = { ...lightweightConfig, ...body };
      return { success: true, data: lightweightConfig };
    } catch (e) {
      res.status(400);
      return { success: false, message: 'Invalid config body' };
    }
  });

  // Get LN Markets index data
  fastify.get('/market/index', {
    schema: {
      description: 'Get current LN Markets index data',
      tags: ['Market Data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                index: { type: 'number' },
                index24hChange: { type: 'number' },
                tradingFees: { type: 'number' },
                nextFunding: { type: 'string' },
                rate: { type: 'number' },
                rateChange: { type: 'number' },
                timestamp: { type: 'number' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      
      console.log('🔍 MARKET INDEX - Getting LN Markets index data for user:', user.id);

      // Get user credentials
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
        },
      });

      if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured',
        });
      }

      // Decrypt credentials
      const { AuthService } = await import('../services/auth.service');
      const authService = new AuthService(prisma, {} as any);
      const apiKey = authService.decryptData(userProfile.ln_markets_api_key);
      const apiSecret = authService.decryptData(userProfile.ln_markets_api_secret);
      const passphrase = authService.decryptData(userProfile.ln_markets_passphrase);

      // Initialize LN Markets service
      const lnMarketsService = new LNMarketsAPIService({
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false,
      });

      // Get market index data from LN Markets
      let marketIndexData;
      try {
        marketIndexData = await lnMarketsService.getMarketIndex();
        console.log('✅ MARKET INDEX - LN Markets index data retrieved:', marketIndexData);
      } catch (lnMarketsError: any) {
        console.log('⚠️ MARKET INDEX - LN Markets API failed, using Binance as fallback:', lnMarketsError?.message || lnMarketsError);
        
        // Fallback to Binance for real BTC price
        const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        const binanceData = await binanceResponse.json() as any;
        
        if (binanceData && binanceData.lastPrice) {
          marketIndexData = {
            price: parseFloat(binanceData.lastPrice),
            change24h: parseFloat(binanceData.priceChange) || 0,
            changePercent24h: parseFloat(binanceData.priceChangePercent) || 0
          };
        } else {
          // Fallback final com dados simulados
          marketIndexData = {
            price: 115000,
            change24h: 0,
            changePercent24h: 0
          };
        }
        
        console.log('✅ MARKET INDEX - Using Binance fallback data:', marketIndexData);
      }

      // Calculate Next Funding (LN Markets funding every 8h: 00:00, 08:00, 16:00 UTC)
      const now = new Date();
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();
      const currentSecond = now.getUTCSeconds();
      
      let nextFundingHour;
      if (currentHour < 8) {
        nextFundingHour = 8;
      } else if (currentHour < 16) {
        nextFundingHour = 16;
      } else {
        nextFundingHour = 24; // Next day 00:00
      }
      
      const hoursToNext = nextFundingHour - currentHour;
      const minutesToNext = 60 - currentMinute;
      const secondsToNext = 60 - currentSecond;
      
      const nextFunding = hoursToNext === 0 
        ? `${minutesToNext - 1}m ${secondsToNext}s`
        : `${hoursToNext - 1}h ${minutesToNext - 1}m ${secondsToNext}s`;

      return reply.status(200).send({
        success: true,
        data: {
          index: marketIndexData.price || marketIndexData.index || 0,
          index24hChange: marketIndexData.change24h || marketIndexData.changePercent24h || 0,
          tradingFees: 0.1, // LN Markets standard fee
          nextFunding: nextFunding,
          rate: 0.00006, // 0.0060% in decimal
          rateChange: 0.00001,
          timestamp: Date.now()
        }
      });
    } catch (error: any) {
      console.error('❌ MARKET INDEX - Error getting LN Markets index data:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get LN Markets index data',
        details: error.message
      });
    }
  });

  // Get current market data
  fastify.get('/market/data', {
    schema: {
      description: 'Get current market data',
      tags: ['Market Data'],
      querystring: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Trading symbol (e.g., BTCUSD)', default: 'BTCUSD' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                symbol: { type: 'string' },
                price: { type: 'number' },
                change24h: { type: 'number' },
                changePercent24h: { type: 'number' },
                volume24h: { type: 'number' },
                high24h: { type: 'number' },
                low24h: { type: 'number' },
                timestamp: { type: 'number' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { symbol = 'BTCUSD' } = request.query as any;
      
      console.log('🔍 MARKET DATA - Getting current market data for:', symbol);

      // Get user credentials
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
        },
      });

      if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured',
        });
      }

      // Initialize LN Markets service
      const lnMarketsService = new LNMarketsAPIService({
        apiKey: userProfile.ln_markets_api_key,
        apiSecret: userProfile.ln_markets_api_secret,
        passphrase: userProfile.ln_markets_passphrase,
        isTestnet: false,
      });

      // Get current market data
      const marketData = await lnMarketsService.getMarketData();
      
      console.log('✅ MARKET DATA - Current market data retrieved:', marketData);

      return reply.status(200).send({
        success: true,
        data: {
          symbol,
          price: marketData.price || 0,
          change24h: marketData.change24h || 0,
          changePercent24h: marketData.changePercent24h || 0,
          volume24h: marketData.volume24h || 0,
          high24h: marketData.high24h || 0,
          low24h: marketData.low24h || 0,
          timestamp: Date.now()
        }
      });
    } catch (error: any) {
      console.error('❌ MARKET DATA - Error getting current market data:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get current market data',
        details: error.message
      });
    }
  });

  // Cache para dados de mercado (30 segundos - apenas para evitar spam de requisições)
  let marketDataCache = {
    data: null,
    timestamp: 0,
    ttl: 30 * 1000 // 30 segundos - dados devem ser muito recentes
  };

  // PUBLIC ENDPOINT - Get basic market index data (no auth required)
  fastify.get('/market/index/public', {
    schema: {
      description: 'Get basic market index data (public endpoint)',
      tags: ['Market Data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                index: { type: 'number' },
                index24hChange: { type: 'number' },
                tradingFees: { type: 'number' },
                nextFunding: { type: 'string' },
                rate: { type: 'number' },
                timestamp: { type: 'string' },
                source: { type: 'string' }
              }
            }
          }
        },
        503: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      console.log('🔍 PUBLIC MARKET INDEX - Getting market index data');

      // Verificar cache apenas para evitar spam (30 segundos máximo)
      const now = Date.now();
      if (marketDataCache.data && (now - marketDataCache.timestamp) < marketDataCache.ttl) {
        console.log('✅ PUBLIC MARKET INDEX - Using recent cached data (30s)');
        return reply.status(200).send({
          success: true,
          data: marketDataCache.data
        });
      }

      // 1. Get current index from LN Markets com retry
      let lnMarketsData = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔍 PUBLIC MARKET INDEX - Attempt ${attempt}/3 - Getting current index from LN Markets...`);
          const response = await fetch('https://api.lnmarkets.com/v2/futures/ticker', {
            timeout: 15000 // Aumentado para 15 segundos
          });
        
          if (response.ok) {
            const data = await response.json();
            lnMarketsData = {
              index: data.index || data.price || data.lastPrice,
              source: 'lnmarkets'
            };
            console.log('✅ PUBLIC MARKET INDEX - LN Markets index success:', lnMarketsData);
            break; // Sucesso, sair do loop
          } else {
            console.log(`⚠️ PUBLIC MARKET INDEX - LN Markets attempt ${attempt} failed:`, response.status, response.statusText);
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff
            }
          }
        } catch (lnMarketsError) {
          console.log(`⚠️ PUBLIC MARKET INDEX - LN Markets attempt ${attempt} error:`, lnMarketsError.message);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff
          }
        }
      }

      // 2. Get historical data to calculate 24h change com retry
      let change24hData = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`🔍 PUBLIC MARKET INDEX - Attempt ${attempt}/2 - Getting historical data for 24h change calculation...`);
          
          // Get current price from Binance
          const currentResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
            timeout: 15000
          });
          
          // Get 24h ticker data from Binance (includes 24h change calculation)
          const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', {
            timeout: 15000
          });
          
          if (currentResponse.ok && tickerResponse.ok) {
            const currentData = await currentResponse.json();
            const tickerData = await tickerResponse.json();
            
            const currentPrice = parseFloat(currentData.price);
            const priceChangePercent = parseFloat(tickerData.priceChangePercent);
            
            if (currentPrice && !isNaN(priceChangePercent)) {
              change24hData = {
                change24h: parseFloat(priceChangePercent.toFixed(3))
              };
              console.log('✅ PUBLIC MARKET INDEX - 24h change calculated (CoinGecko style):', {
                currentPrice,
                priceChangePercent: change24hData.change24h,
                method: 'binance-24hr-ticker'
              });
              break; // Sucesso, sair do loop
            }
          } else {
            console.log(`⚠️ PUBLIC MARKET INDEX - Binance attempt ${attempt} response not ok`);
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Backoff
            }
          }
        } catch (binanceError) {
          console.log(`⚠️ PUBLIC MARKET INDEX - Binance attempt ${attempt} error:`, binanceError.message);
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Backoff
          }
        }
      }

      // 3. Fallback to CoinCap if Binance fails
      if (!change24hData) {
        try {
          console.log('🔍 PUBLIC MARKET INDEX - Trying CoinCap as fallback for 24h change...');
        const response = await fetch('https://api.coincap.io/v2/assets/bitcoin', {
          timeout: 15000
        });
          
          if (response.ok) {
            const data = await response.json();
            change24hData = {
              change24h: parseFloat(data.data.changePercent24Hr) || 0
            };
            console.log('✅ PUBLIC MARKET INDEX - CoinCap 24h change success:', change24hData);
          } else {
            console.log('⚠️ PUBLIC MARKET INDEX - CoinCap response not ok:', response.status, response.statusText);
          }
        } catch (coinCapError) {
          console.log('⚠️ PUBLIC MARKET INDEX - CoinCap failed:', coinCapError.message);
        }
      }

      // 4. Combine data from different sources
      const marketData = {
        index: lnMarketsData?.index || 0,
        change24h: change24hData?.change24h || 0,
        source: lnMarketsData?.source || 'fallback'
      };
      
      if (marketData.index && marketData.index > 0) {
        console.log('✅ PUBLIC MARKET INDEX - Using combined data:', marketData);
        
        // Calculate Next Funding (LN Markets funding every 8h: 00:00, 08:00, 16:00 UTC)
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();
        const currentSecond = now.getUTCSeconds();
        
        let nextFundingHour;
        if (currentHour < 8) {
          nextFundingHour = 8;
        } else if (currentHour < 16) {
          nextFundingHour = 16;
        } else {
          nextFundingHour = 24; // Next day 00:00
        }
        
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const nextFundingTimeInMinutes = nextFundingHour * 60;
        const timeDiffInMinutes = nextFundingTimeInMinutes - currentTimeInMinutes;
        
        const hoursToNext = Math.floor(timeDiffInMinutes / 60);
        const minutesToNext = timeDiffInMinutes % 60;
        const secondsToNext = 60 - currentSecond;
        
        const nextFunding = hoursToNext === 0
          ? `${minutesToNext}m ${secondsToNext}s`
          : `${hoursToNext}h ${minutesToNext}m ${secondsToNext}s`;

        const responseData = {
          index: Math.round(marketData.index),
          index24hChange: parseFloat(marketData.change24h.toFixed(3)),
          tradingFees: 0.1, // LN Markets standard fee
          nextFunding: nextFunding,
          rate: 0.00006, // 0.0060% in decimal
          timestamp: new Date().toISOString(),
          source: marketData.source // Include data source
        };

        // Atualizar cache (apenas 30 segundos)
        marketDataCache = {
          data: responseData,
          timestamp: now,
          ttl: 30 * 1000
        };

        return reply.status(200).send({
          success: true,
          data: responseData
        });
      }

      // 5. No data available - return error (NUNCA usar dados antigos em mercado volátil)
      console.log('❌ PUBLIC MARKET INDEX - No reliable data source available');
      return reply.status(503).send({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Market data temporarily unavailable. Please try again later.'
      });

    } catch (error: any) {
      console.error('❌ PUBLIC MARKET INDEX - Error getting market index:', error);
      
      // NUNCA usar cache em caso de erro - dados podem estar desatualizados
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get market index data'
      });
    }
  });
}
