const WebSocket = require('ws');

// Teste de WebSocket
function testWebSocket() {
  console.log('🔌 TESTANDO WEBSOCKET');
  console.log('====================\n');
  
  const ws = new WebSocket('ws://localhost:13000/ws');
  
  ws.on('open', () => {
    console.log('✅ WebSocket conectado com sucesso!');
    
    // Enviar mensagem de teste
    ws.send(JSON.stringify({
      type: 'test',
      message: 'Teste de conexão WebSocket',
      timestamp: new Date().toISOString()
    }));
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 Mensagem recebida:', message);
      
      if (message.type === 'connection') {
        console.log('✅ Conexão WebSocket estabelecida com sucesso!');
      } else if (message.type === 'echo') {
        console.log('✅ Echo funcionando corretamente!');
      }
    } catch (error) {
      console.log('📨 Mensagem recebida (texto):', data.toString());
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ Erro WebSocket:', error.message);
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket desconectado');
  });
  
  // Fechar conexão após 3 segundos
  setTimeout(() => {
    ws.close();
    console.log('\n🎉 Teste WebSocket concluído!');
  }, 3000);
}

// Executar teste
testWebSocket();
