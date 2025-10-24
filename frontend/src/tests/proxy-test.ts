// Teste 1: Verificar se o proxy HTTP funciona
console.log('🧪 Testing HTTP proxy...');
fetch('http://localhost:13000/api/health')
  .then(res => {
    console.log('✅ HTTP Proxy OK - Status:', res.status);
    return res.json();
  })
  .then(data => console.log('✅ HTTP Proxy Data:', data))
  .catch(err => console.error('❌ HTTP Proxy FAIL:', err));

// Teste 2: Verificar se o backend responde diretamente
console.log('🧪 Testing direct backend connection...');
fetch('http://localhost:13010/api/health')
  .then(res => {
    console.log('✅ Backend Direct OK - Status:', res.status);
    return res.json();
  })
  .then(data => console.log('✅ Backend Direct Data:', data))
  .catch(err => console.error('❌ Backend Direct FAIL:', err));

// Teste 3: Verificar WebSocket status
console.log('🧪 Testing WebSocket status endpoint...');
fetch('http://localhost:13010/api/ws/status')
  .then(res => {
    console.log('✅ WebSocket Status OK - Status:', res.status);
    return res.json();
  })
  .then(data => console.log('✅ WebSocket Status Data:', JSON.stringify(data, null, 2)))
  .catch(err => console.error('❌ WebSocket Status FAIL:', err));
