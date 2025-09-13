import { FastifyInstance } from 'fastify';
import { websocketManager } from '@/services/websocket-manager.service';

export async function websocketTestRoutes(fastify: FastifyInstance) {
  console.log('🔌 WEBSOCKET TEST - Registrando rota WebSocket');
  
  // WebSocket route for real-time data (without authentication for testing)
  fastify.get('/ws/realtime', { websocket: true }, async (connection, req) => {
    const userId = (req.query as any)?.userId as string;
    
    console.log('🔌 WEBSOCKET TEST - Nova conexão recebida:', {
      userId,
      remoteAddress: req.socket?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString()
    });
    
           if (!userId) {
             console.log('❌ WEBSOCKET TEST - User ID não fornecido, fechando conexão');
             connection.close(1008, 'User ID is required');
             return;
           }

    console.log('🔌 WEBSOCKET TEST - Processando conexão para usuário:', userId);
    
    // Get user credentials from database or config
    const credentials = {
      apiKey: process.env.LN_MARKETS_API_KEY || '',
      apiSecret: process.env.LN_MARKETS_API_SECRET || '',
      passphrase: process.env.LN_MARKETS_PASSPHRASE || '',
      isTestnet: process.env.LN_MARKETS_TESTNET === 'true'
    };

    console.log('🔑 WEBSOCKET TEST - Credenciais LN Markets:', {
      hasApiKey: !!credentials.apiKey,
      hasApiSecret: !!credentials.apiSecret,
      hasPassphrase: !!credentials.passphrase,
      isTestnet: credentials.isTestnet
    });

    try {
      console.log('🔄 WEBSOCKET TEST - Configurando conexão WebSocket para usuário:', userId);
      
      // Enviar mensagem de confirmação de conexão imediatamente
      const connectionMessage = {
        type: 'connection_established',
        data: {
          userId,
          timestamp: Date.now(),
          message: 'WebSocket connection established successfully'
        }
      };
      
      console.log('📤 WEBSOCKET TEST - Enviando mensagem de confirmação:', connectionMessage);
      connection.send(JSON.stringify(connectionMessage));
      console.log('✅ WEBSOCKET TEST - Mensagem de confirmação enviada com sucesso');

      // Enviar dados de teste a cada 5 segundos
      const testDataInterval = setInterval(() => {
        const testMarketData = {
          type: 'market_data',
          data: {
            symbol: 'BTC',
            price: 50000 + Math.random() * 1000,
            volume: 1000000 + Math.random() * 100000,
            timestamp: Date.now()
          }
        };
        
        const testPositionData = {
          type: 'position_update',
          data: {
            id: 'test-position-' + Date.now(),
            symbol: 'BTC',
            side: 'long',
            quantity: 100,
            price: 50000 + Math.random() * 1000,
            margin: 1000,
            leverage: 10,
            pnl: -100 + Math.random() * 200,
            pnlPercent: -5 + Math.random() * 10,
            timestamp: Date.now()
          }
        };

               try {
                 connection.send(JSON.stringify(testMarketData));
                 connection.send(JSON.stringify(testPositionData));
                 console.log('📊 WEBSOCKET TEST - Dados de teste enviados');
               } catch (error) {
                 console.error('❌ WEBSOCKET TEST - Erro ao enviar dados de teste:', error);
                 clearInterval(testDataInterval);
               }
      }, 5000);

      // Handle client messages
      connection.on('message', (message) => {
        console.log('📨 WEBSOCKET TEST - Mensagem recebida do cliente:', {
          userId,
          message: message.toString(),
          timestamp: new Date().toISOString()
        });

        try {
          const data = JSON.parse(message.toString());
          console.log('📨 WEBSOCKET TEST - Dados parseados:', data);
          // Por enquanto, apenas logamos as mensagens recebidas
        } catch (error) {
          console.error('❌ WEBSOCKET TEST - Erro ao processar mensagem:', {
            error,
            message: message.toString(),
            userId,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle connection close
      connection.on('close', (code, reason) => {
        console.log('🔌 WEBSOCKET TEST - Conexão fechada:', {
          userId,
          code,
          reason: reason.toString(),
          timestamp: new Date().toISOString()
        });
        clearInterval(testDataInterval);
      });

      // Handle connection error
      connection.on('error', (error) => {
        console.error('❌ WEBSOCKET TEST - Erro na conexão:', {
          userId,
          error,
          timestamp: new Date().toISOString()
        });
        clearInterval(testDataInterval);
      });

    } catch (error) {
      console.error('❌ WEBSOCKET TEST - Erro ao criar conexão:', {
        error,
        userId,
        timestamp: new Date().toISOString()
      });
             connection.close(1011, 'Internal server error');
    }
  });
}