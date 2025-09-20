import { FastifyInstance } from 'fastify';
// import { websocketManager } from '../services/websocket-manager.service';

export async function websocketTestRoutes(fastify: FastifyInstance) {
  console.log('🔌 WEBSOCKET TEST - Registrando rota WebSocket');
  
  // WebSocket route for real-time data (without authentication for testing)
  fastify.get('/ws/realtime', { websocket: true }, async (connection: any, req) => {
    const userId = (req.query as any)?.userId as string;
    
    console.log('🔌 WEBSOCKET TEST - Nova conexão recebida:', {
      userId,
      remoteAddress: req.socket?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString(),
      query: req.query
    });
    
    if (!userId) {
      console.log('❌ WEBSOCKET TEST - User ID não fornecido, fechando conexão');
      connection.socket.close(1008, 'User ID is required');
      return;
    }

    console.log('🔌 WEBSOCKET TEST - Processando conexão para usuário:', userId);
    
    // Get user credentials from database or config
    const credentials = {
      apiKey: process.env['LN_MARKETS_API_KEY'] || 'dummy-api-key',
      apiSecret: process.env['LN_MARKETS_API_SECRET'] || 'dummy-api-secret',
      passphrase: process.env['LN_MARKETS_PASSPHRASE'] || 'dummy-passphrase',
      isTestnet: process.env['LN_MARKETS_TESTNET'] === 'true'
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

      // DISABLED: Simulação de dados de teste desabilitada para usar dados reais da LN Markets
      // Os dados agora vêm diretamente da API da LN Markets via PositionsContext
      console.log('📊 WEBSOCKET TEST - Simulação desabilitada, usando dados reais da LN Markets');

      // Handle client messages
      connection.on('message', (message: any) => {
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
      connection.on('close', (code: any, reason: any) => {
        console.log('🔌 WEBSOCKET TEST - Conexão fechada:', {
          userId,
          code,
          reason: reason.toString(),
          timestamp: new Date().toISOString()
        });
      });

      // Handle connection error
      connection.on('error', (error: any) => {
        console.error('❌ WEBSOCKET TEST - Erro na conexão:', {
          userId,
          error,
          timestamp: new Date().toISOString()
        });
      });

    } catch (error) {
      console.error('❌ WEBSOCKET TEST - Erro ao criar conexão:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        timestamp: new Date().toISOString()
      });
      // Enviar mensagem de erro antes de fechar
      try {
        const errorMessage = {
          type: 'error',
          data: {
            message: 'Internal server error',
            timestamp: Date.now()
          }
        };
        connection.send(JSON.stringify(errorMessage));
      } catch (sendError) {
        console.error('❌ WEBSOCKET TEST - Erro ao enviar mensagem de erro:', sendError);
      }
      connection.socket.close(1011, 'Internal server error');
    }
  });
}