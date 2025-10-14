import { FastifyInstance } from 'fastify';
import { LNMarketsRobustService } from '../services/LNMarketsRobustService';
import { AuthService } from '../services/auth.service';

// Global WebSocket connections manager
const wsConnections = new Map<string, any>();

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

    // ✅ ARMAZENAR USER ID NA CONEXÃO PARA BROADCAST
    connection.userId = userId;
    
    // ✅ ADICIONAR CONEXÃO AO MANAGER GLOBAL
    wsConnections.set(userId, connection);
    console.log('✅ WEBSOCKET - Connection added to global manager:', { userId, totalConnections: wsConnections.size });

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
                    
    // Get user credentials using the new exchange accounts system
    const { AccountCredentialsService } = await import('../services/account-credentials.service');
    const accountCredentialsService = new AccountCredentialsService(prisma);
    
    const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(userId);
    
    if (!activeCredentials) {
                      connection.send(JSON.stringify({
                        type: 'error',
                        message: 'No active exchange account found',
                        timestamp: new Date().toISOString()
                      }));
      return;
    }

    const credentials = activeCredentials.credentials;

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
                    
                    // ✅ BUSCAR DADOS DE MERCADO PÚBLICO (SEM CREDENCIAIS)
                    try {
                      console.log('📊 WEBSOCKET - Buscando dados de mercado público...');
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
                        
                        console.log('📊 WEBSOCKET - Dados de mercado CoinGecko enviados:', {
                          symbol: 'BTC',
                          price: btcPrice,
                          change24h: change24h
                        });
                      }
                    } catch (marketError) {
                      console.error('❌ WEBSOCKET - Erro ao buscar dados de mercado:', marketError);
                      // Não enviar dados se falhar - usuário não vê preço
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

    // ✅ INTERVALO PARA ATUALIZAR DADOS DE MERCADO PÚBLICO
    const marketInterval = setInterval(async () => {
      try {
        console.log('📊 WEBSOCKET - Atualizando dados de mercado público...');
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
        // Não enviar dados se falhar - usuário não vê preço
      }
    }, 10000); // Atualizar a cada 10 segundos

    // ✅ HANDLE CONNECTION CLOSE (como commit estável)
    connection.on('close', () => {
      console.log('🔌 WEBSOCKET - Conexão fechada para usuário:', userId);
      clearInterval(marketInterval);
      
      // ✅ REMOVER CONEXÃO DO MANAGER GLOBAL
      wsConnections.delete(userId);
      console.log('✅ WEBSOCKET - Connection removed from global manager:', { userId, totalConnections: wsConnections.size });
    });

    // ✅ HANDLE ERRORS (como commit estável)
    connection.on('error', (error: any) => {
      console.error('🔌 WEBSOCKET - Erro na conexão:', error);
    });

    console.log('✅ WEBSOCKET - Conexão estabelecida com sucesso para usuário:', userId);
  });
}

// Export function to broadcast messages to specific user
export function broadcastToUser(userId: string, message: any) {
  const connection = wsConnections.get(userId);
  if (connection && connection.readyState === 1) { // WebSocket.OPEN
    console.log('📡 WEBSOCKET - Broadcasting message to user:', { userId, message });
    connection.send(JSON.stringify(message));
    return true;
  } else {
    console.log('⚠️ WEBSOCKET - No active connection found for user:', userId);
    return false;
  }
}

// Export function to get connection count
export function getConnectionCount() {
  return wsConnections.size;
}