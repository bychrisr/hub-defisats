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
            // Buscar credenciais do usuário
            const authService = new AuthService();
            const userCredentials = await authService.getUserCredentials(userId);
            
            if (!userCredentials) {
              connection.send(JSON.stringify({
                type: 'error',
                message: 'User credentials not found',
                timestamp: new Date().toISOString()
              }));
              return;
            }

            // Criar instância do LNMarketsRobustService
            const lnMarketsService = new LNMarketsRobustService(userCredentials);
            
            // Buscar dados atualizados
            const userData = await lnMarketsService.getAllUserData();
            
            // Enviar dados atualizados
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

    // ✅ HANDLE CONNECTION CLOSE (como commit estável)
    connection.on('close', () => {
      console.log('🔌 WEBSOCKET - Conexão fechada para usuário:', userId);
    });

    // ✅ HANDLE ERRORS (como commit estável)
    connection.on('error', (error: any) => {
      console.error('🔌 WEBSOCKET - Erro na conexão:', error);
    });

    console.log('✅ WEBSOCKET - Conexão estabelecida com sucesso para usuário:', userId);
  });
}