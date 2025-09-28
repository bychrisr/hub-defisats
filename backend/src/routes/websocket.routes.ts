import { FastifyInstance } from 'fastify';
import { LNMarketsRobustService } from '../services/LNMarketsRobustService';
import { AuthService } from '../services/auth.service';

export async function websocketRoutes(fastify: FastifyInstance) {
  // ✅ WEBSOCKET SIMPLES: Baseado no commit estável que funcionava perfeitamente
  fastify.get('/ws', { websocket: true }, async (connection: any, req) => {
    const userId = (req.query as any).userId as string;
    
    console.log('🔌 WEBSOCKET - Nova conexão estabelecida:', {
      userId,
      remoteAddress: req.socket.remoteAddress,
      timestamp: new Date().toISOString()
    });
    
    if (!userId) {
      console.log('❌ WEBSOCKET - User ID não fornecido, fechando conexão');
      connection.close(1008, 'User ID is required');
      return;
    }

    // ✅ MENSAGEM DE BOAS-VINDAS (como commit estável)
    connection.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to WebSocket server',
      userId: userId,
      timestamp: new Date().toISOString()
    }));

    // ✅ HANDLE INCOMING MESSAGES (integrado com LNMarketsRobustService)
    connection.on('message', async (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('🔌 WEBSOCKET - Mensagem recebida:', data);
        
                // ✅ HANDLE REFRESH DATA (integração com LNMarketsRobustService)
                if (data.type === 'refresh_data') {
                  console.log('🔄 WEBSOCKET - Atualizando dados via LNMarketsRobustService...');
                  
                  try {
                    // ✅ BUSCAR CREDENCIAIS (usar instância global do Prisma)
                    const prisma = (req.server as any).prisma;
                    
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true,
                        email: true,
                        username: true,
                        plan_type: true,
      },
    });

    if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
                      connection.send(JSON.stringify({
                        type: 'error',
                        message: 'LN Markets credentials not configured',
                        timestamp: new Date().toISOString()
                      }));
      return;
    }

                    // ✅ DESCRIPTOGRAFIA (mesma lógica do endpoint dashboard)
    const { AuthService } = await import('../services/auth.service');
                    const authService = new AuthService(prisma, req.server);
                    
                    let credentials;
                    
                    // Detectar se credenciais estão criptografadas
                    const isEncrypted = userProfile.ln_markets_api_key?.includes(':') && 
                                       /^[0-9a-fA-F:]+$/.test(userProfile.ln_markets_api_key || '');
                    
                    if (isEncrypted) {
                      console.log('🔐 WEBSOCKET - Credentials are encrypted, decrypting...');
                      credentials = {
      apiKey: authService.decryptData(userProfile.ln_markets_api_key),
      apiSecret: authService.decryptData(userProfile.ln_markets_api_secret),
      passphrase: authService.decryptData(userProfile.ln_markets_passphrase),
                      };
      } else {
                      console.log('🔓 WEBSOCKET - Credentials are plain text');
                      credentials = {
          apiKey: userProfile.ln_markets_api_key,
          apiSecret: userProfile.ln_markets_api_secret,
          passphrase: userProfile.ln_markets_passphrase,
                      };
                    }

                    // ✅ CRIAR SERVIÇO E BUSCAR DADOS
                    console.log('🔄 WEBSOCKET - Criando LNMarketsRobustService com credenciais...');
                    const lnMarketsService = new LNMarketsRobustService(credentials);
                    
                    console.log('🔄 WEBSOCKET - Buscando dados via getAllUserData...');
                    const userData = await lnMarketsService.getAllUserData();
                    
                    console.log('📊 WEBSOCKET - Dados recebidos:', {
                      hasUser: !!userData.user,
                      positionsCount: userData.positions?.length || 0,
                      userBalance: userData.user?.balance || 'N/A',
                      username: userData.user?.username || 'N/A'
                    });
                    
                    // ✅ BUSCAR DADOS DE MERCADO DA LN MARKETS
                    try {
                      console.log('📊 WEBSOCKET - Buscando dados de mercado da LN Markets...');
                      const marketData = await lnMarketsService.getMarketData();
                      
                      if (marketData && marketData.lastPrice) {
                        const btcPrice = marketData.lastPrice;
                        const index = marketData.index || btcPrice;
                        
                        // Enviar dados de mercado
                        connection.send(JSON.stringify({
                          type: 'market_data',
                          data: {
                            symbol: 'BTC',
                            price: btcPrice,
                            change24h: 0, // LN Markets não fornece mudança 24h no ticker
                            changePercent24h: 0,
                            volume24h: 0, // LN Markets não fornece volume no ticker
                            high24h: btcPrice * 1.02, // Simulado
                            low24h: btcPrice * 0.98, // Simulado
                            timestamp: Date.now()
                          },
                          timestamp: Date.now()
                        }));
                        
                        console.log('📊 WEBSOCKET - Dados de mercado LN Markets enviados:', {
                          symbol: 'BTC',
                          price: btcPrice,
                          index: index
                        });
                      }
                    } catch (marketError) {
                      console.error('❌ WEBSOCKET - Erro ao buscar dados de mercado da LN Markets:', marketError);
                      
                      // Fallback para CoinGecko se LN Markets falhar
                      try {
                        console.log('📊 WEBSOCKET - Tentando fallback CoinGecko...');
                        const marketResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
                        const marketData = await marketResponse.json();
                        
                        if (marketData.bitcoin) {
                          const btcPrice = marketData.bitcoin.usd;
                          const change24h = marketData.bitcoin.usd_24h_change || 0;
                          
                          connection.send(JSON.stringify({
                            type: 'market_data',
                            data: {
                              symbol: 'BTC',
                              price: btcPrice,
                              change24h: change24h,
                              changePercent24h: change24h,
                              volume24h: 0,
                              high24h: btcPrice * 1.02,
                              low24h: btcPrice * 0.98,
                              timestamp: Date.now()
                            },
                            timestamp: Date.now()
                          }));
                          
                          console.log('📊 WEBSOCKET - Fallback CoinGecko enviado:', {
                            symbol: 'BTC',
                            price: btcPrice,
                            change24h: change24h
                          });
                        }
                      } catch (fallbackError) {
                        console.error('❌ WEBSOCKET - Fallback CoinGecko também falhou:', fallbackError);
                      }
                    }

                    // ✅ ENVIAR DADOS ATUALIZADOS
                    connection.send(JSON.stringify({
                      type: 'data_update',
                      data: userData,
                      timestamp: new Date().toISOString()
                    }));
                    
                    console.log('✅ WEBSOCKET - Dados atualizados enviados:', {
                      userId,
                      positionsCount: userData.positions.length,
                      hasUser: !!userData.user
                    });
                    
                  } catch (error) {
                    console.error('❌ WEBSOCKET - Erro ao buscar dados:', error);
                    connection.send(JSON.stringify({
                      type: 'error',
                      message: 'Failed to fetch data',
                      error: error.message,
                      timestamp: new Date().toISOString()
                    }));
                  }
        } else {
          // ✅ ECHO BACK OTHER MESSAGES (como commit estável)
          connection.send(JSON.stringify({
            type: 'echo',
            originalMessage: data,
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('🔌 WEBSOCKET - Erro ao processar mensagem:', error);
      }
    });

    // ✅ INTERVALO PARA ATUALIZAR DADOS DE MERCADO DA LN MARKETS
    const marketInterval = setInterval(async () => {
      try {
        console.log('📊 WEBSOCKET - Atualizando dados de mercado da LN Markets...');
        
        // Buscar dados da LN Markets se temos credenciais
        if (userProfile && userProfile.ln_markets_api_key) {
          try {
            const credentials = {
              apiKey: userProfile.ln_markets_api_key,
              apiSecret: userProfile.ln_markets_api_secret,
              passphrase: userProfile.ln_markets_passphrase,
            };
            
            const lnMarketsService = new LNMarketsRobustService(credentials);
            const marketData = await lnMarketsService.getMarketData();
            
            if (marketData && marketData.lastPrice) {
              const btcPrice = marketData.lastPrice;
              const index = marketData.index || btcPrice;
              
              // Enviar dados de mercado
              connection.send(JSON.stringify({
                type: 'market_data',
                data: {
                  symbol: 'BTC',
                  price: btcPrice,
                  change24h: 0, // LN Markets não fornece mudança 24h no ticker
                  changePercent24h: 0,
                  volume24h: 0, // LN Markets não fornece volume no ticker
                  high24h: btcPrice * 1.02, // Simulado
                  low24h: btcPrice * 0.98, // Simulado
                  timestamp: Date.now()
                },
                timestamp: Date.now()
              }));
              
              console.log('📊 WEBSOCKET - Dados de mercado LN Markets atualizados:', {
                symbol: 'BTC',
                price: btcPrice,
                index: index
              });
              return; // Sucesso, não tentar fallback
            }
          } catch (lnMarketsError) {
            console.error('❌ WEBSOCKET - Erro ao buscar dados da LN Markets:', lnMarketsError);
          }
        }
        
        // Fallback para CoinGecko se LN Markets falhar ou não tiver credenciais
        console.log('📊 WEBSOCKET - Usando fallback CoinGecko...');
        const marketResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
        const marketData = await marketResponse.json();
        
        if (marketData.bitcoin) {
          const btcPrice = marketData.bitcoin.usd;
          const change24h = marketData.bitcoin.usd_24h_change || 0;
          
          // Enviar dados de mercado
          connection.send(JSON.stringify({
            type: 'market_data',
            data: {
              symbol: 'BTC',
              price: btcPrice,
              change24h: change24h,
              changePercent24h: change24h,
              volume24h: 0, // CoinGecko não fornece volume neste endpoint
              high24h: btcPrice * 1.02, // Simulado
              low24h: btcPrice * 0.98, // Simulado
              timestamp: Date.now()
            },
            timestamp: Date.now()
          }));
          
          console.log('📊 WEBSOCKET - Dados de mercado CoinGecko atualizados:', {
            symbol: 'BTC',
            price: btcPrice,
            change24h: change24h
          });
        }
      } catch (marketError) {
        console.error('❌ WEBSOCKET - Erro ao atualizar dados de mercado:', marketError);
      }
    }, 10000); // Atualizar a cada 10 segundos

    // ✅ HANDLE CONNECTION CLOSE (como commit estável)
    connection.on('close', () => {
      console.log('🔌 WEBSOCKET - Conexão fechada para usuário:', userId);
      clearInterval(marketInterval);
    });

    // ✅ HANDLE ERRORS (como commit estável)
    connection.on('error', (error: any) => {
      console.error('🔌 WEBSOCKET - Erro na conexão:', error);
    });

    console.log('✅ WEBSOCKET - Conexão estabelecida com sucesso para usuário:', userId);
  });
}