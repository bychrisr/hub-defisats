#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🧪 TESTE: Integração WebSocket + LNMarketsRobustService');
console.log('=' .repeat(60));

const wsUrl = 'ws://localhost:13000/ws?userId=373d9132-3af7-4f80-bd43-d21b6425ab39';

console.log('🔌 Conectando ao WebSocket:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('✅ WebSocket conectado com sucesso!');
  
  // Aguardar 1 segundo e enviar refresh_data
  setTimeout(() => {
    console.log('🔄 Enviando mensagem refresh_data...');
    ws.send(JSON.stringify({
      type: 'refresh_data',
      userId: '373d9132-3af7-4f80-bd43-d21b6425ab39'
    }));
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Mensagem recebida:', {
      type: message.type,
      timestamp: message.timestamp,
      hasData: !!message.data,
      positionsCount: message.data?.positions?.length || 0,
      hasUser: !!message.data?.user
    });
    
    if (message.type === 'data_update') {
      console.log('🎉 SUCESSO: Dados atualizados via LNMarketsRobustService!');
      console.log('📊 Posições:', message.data.positions.length);
      console.log('👤 Usuário:', message.data.user?.username || 'N/A');
      console.log('💰 Saldo:', message.data.user?.balance || 'N/A');
      
      // Fechar conexão após sucesso
      setTimeout(() => {
        console.log('🔌 Fechando conexão...');
        ws.close();
      }, 2000);
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ Erro WebSocket:', error);
});

ws.on('close', () => {
  console.log('🔌 Conexão WebSocket fechada');
  console.log('✅ Teste concluído!');
});

// Timeout de 10 segundos
setTimeout(() => {
  console.log('⏰ Timeout - fechando conexão');
  ws.close();
}, 10000);
