const WebSocket = require('ws');

console.log('🔌 Testing direct WebSocket connection to backend...');
console.log('Target: ws://localhost:13010/api/ws?userId=test-user');

const ws = new WebSocket('ws://localhost:13010/api/ws?userId=test-user');

ws.on('open', () => {
  console.log('✅ DIRECT CONNECTION - Connected successfully');
  console.log('  URL:', ws.url);
  console.log('  ReadyState:', ws.readyState);
  console.log('  Protocol:', ws.protocol);
  console.log('  Extensions:', ws.extensions);
});

ws.on('message', (data) => {
  console.log('📨 DIRECT CONNECTION - Message received:', data.toString());
  try {
    const parsed = JSON.parse(data.toString());
    console.log('📨 DIRECT CONNECTION - Parsed message:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('⚠️ DIRECT CONNECTION - Could not parse message as JSON');
  }
});

ws.on('error', (error) => {
  console.error('❌ DIRECT CONNECTION - Error:', error.message);
  console.error('Error details:', error);
});

ws.on('close', (code, reason) => {
  console.log('🔌 DIRECT CONNECTION - Closed:', { 
    code, 
    reason: reason.toString(),
    timestamp: new Date().toISOString()
  });
  process.exit(code === 1000 ? 0 : 1);
});

// Timeout de segurança
setTimeout(() => {
  console.log('⏰ Test timeout (5s) - closing connection');
  if (ws.readyState === WebSocket.OPEN) {
    console.log('✅ Connection was successful!');
    ws.close(1000, 'Test completed');
  } else {
    console.error('❌ Connection failed - readyState:', ws.readyState);
    process.exit(1);
  }
}, 5000);
