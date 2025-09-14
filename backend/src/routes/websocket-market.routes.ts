import { FastifyInstance } from 'fastify';
import { LNMarketsWebSocketService } from '@/services/lnmarkets-websocket.service';

export async function websocketMarketRoutes(fastify: FastifyInstance) {
  const lnMarketsWS = new LNMarketsWebSocketService(false);

  // WebSocket para dados de mercado em tempo real
  fastify.register(async function (fastify) {
    fastify.get('/ws/market', { websocket: true }, (connection: any, _req) => {
      console.log('🔌 WEBSOCKET MARKET - New connection established');

      // Conectar ao WebSocket da LN Markets
      lnMarketsWS.connect().then(() => {
        console.log('✅ WEBSOCKET MARKET - LN Markets WebSocket connected');
        
        // Subscrever a atualizações de preço
        lnMarketsWS.subscribe('BTCUSD');
        
        // Escutar atualizações de preço
        lnMarketsWS.on('price_update', (data) => {
          console.log('📊 WEBSOCKET MARKET - Broadcasting price update:', data);
          connection.send(JSON.stringify({
            type: 'market_data',
            data: data.data,
            timestamp: Date.now()
          }));
        });

        // Escutar erros
        lnMarketsWS.on('error', (error) => {
          console.error('❌ WEBSOCKET MARKET - LN Markets error:', error);
          connection.send(JSON.stringify({
            type: 'error',
            message: 'LN Markets connection error',
            timestamp: Date.now()
          }));
        });

        // Escutar desconexão
        lnMarketsWS.on('disconnected', () => {
          console.log('🔌 WEBSOCKET MARKET - LN Markets disconnected');
          connection.send(JSON.stringify({
            type: 'disconnected',
            message: 'LN Markets connection lost',
            timestamp: Date.now()
          }));
        });

      }).catch((error) => {
        console.error('❌ WEBSOCKET MARKET - Failed to connect to LN Markets:', error);
        connection.send(JSON.stringify({
          type: 'error',
          message: 'Failed to connect to LN Markets',
          timestamp: Date.now()
        }));
      });

      // Escutar mensagens do cliente
      connection.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('📨 WEBSOCKET MARKET - Message from client:', data);
          
          switch (data.type) {
            case 'subscribe':
              lnMarketsWS.subscribe(data.symbol || 'BTCUSD');
              break;
            case 'unsubscribe':
              lnMarketsWS.unsubscribe(data.symbol || 'BTCUSD');
              break;
            case 'ping':
              connection.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (error) {
          console.error('❌ WEBSOCKET MARKET - Error parsing client message:', error);
        }
      });

      // Escutar desconexão do cliente
      connection.on('close', () => {
        console.log('🔌 WEBSOCKET MARKET - Client disconnected');
        lnMarketsWS.unsubscribe('BTCUSD');
      });

      // Escutar erros do cliente
      connection.on('error', (error: any) => {
        console.error('❌ WEBSOCKET MARKET - Client error:', error);
      });
    });
  });
}
