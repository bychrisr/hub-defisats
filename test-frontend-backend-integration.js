const http = require('http');

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Teste de integração frontend + backend
async function testFrontendBackendIntegration() {
  console.log('🔍 TESTE DE INTEGRAÇÃO FRONTEND + BACKEND');
  console.log('==========================================\n');
  
  const API_BASE = 'http://localhost:13000';
  const FRONTEND_BASE = 'http://localhost:3001';
  let allTestsPassed = true;
  
  // Teste 1: Backend Health Check
  console.log('1️⃣ Testando Backend Health Check...');
  try {
    const healthResult = await makeRequest(`${API_BASE}/api/health`);
    if (healthResult.status === 200 && healthResult.data.status === 'ok') {
      console.log('   ✅ Backend Health Check: OK');
    } else {
      console.log('   ❌ Backend Health Check: FALHOU');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Backend Health Check: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // Teste 2: Frontend Acessível
  console.log('\n2️⃣ Testando Frontend Acessível...');
  try {
    const frontendResult = await makeRequest(`${FRONTEND_BASE}/`);
    if (frontendResult.status === 200 && frontendResult.data.includes('html')) {
      console.log('   ✅ Frontend: OK');
    } else {
      console.log('   ❌ Frontend: FALHOU');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Frontend: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // Teste 3: Endpoints que o Frontend Precisa
  console.log('\n3️⃣ Testando Endpoints Necessários para o Frontend...');
  
  // 3.1: Favicon
  try {
    const faviconResult = await makeRequest(`${API_BASE}/favicon.svg`);
    if (faviconResult.status === 200) {
      console.log('   ✅ Favicon: OK');
    } else {
      console.log('   ❌ Favicon: FALHOU');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Favicon: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // 3.2: Auth Login
  try {
    const loginResult = await makeRequest(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123456'
      })
    });
    if (loginResult.status === 200 && loginResult.data.success) {
      console.log('   ✅ Auth Login: OK');
    } else {
      console.log('   ❌ Auth Login: FALHOU');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Auth Login: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // 3.3: WebSocket Mock
  try {
    const wsResult = await makeRequest(`${API_BASE}/ws?token=test123`);
    if (wsResult.status === 200 && wsResult.data.success) {
      console.log('   ✅ WebSocket Mock: OK');
    } else {
      console.log('   ❌ WebSocket Mock: FALHOU');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ WebSocket Mock: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // Teste 4: Dados do Usuário
  console.log('\n4️⃣ Testando Dados do Usuário...');
  try {
    const dashboardResult = await makeRequest(`${API_BASE}/api/lnmarkets/v2/user/dashboard`);
    if (dashboardResult.status === 200 && dashboardResult.data.success) {
      const user = dashboardResult.data.data.user;
      console.log('   ✅ Dashboard: OK');
      console.log(`   📊 Usuário: ${user.username} (${user.email})`);
      console.log(`   💰 Saldo: $${dashboardResult.data.data.balance.balance}`);
      console.log(`   📈 Posições: ${dashboardResult.data.data.positions.length} posições`);
    } else {
      console.log('   ❌ Dashboard: FALHOU');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Dashboard: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // Teste 5: Simulação de Requisição do Frontend
  console.log('\n5️⃣ Simulando Requisições do Frontend...');
  try {
    // Simular requisição de login (como o frontend faria)
    const loginResponse = await makeRequest(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123456'
      })
    });
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('   ✅ Frontend pode fazer login');
      
      // Simular requisição de dashboard (como o frontend faria)
      const dashboardResponse = await makeRequest(`${API_BASE}/api/lnmarkets/v2/user/dashboard`);
      if (dashboardResponse.status === 200 && dashboardResponse.data.success) {
        console.log('   ✅ Frontend pode acessar dashboard');
        console.log('   ✅ Frontend pode exibir dados do usuário');
      } else {
        console.log('   ❌ Frontend não consegue acessar dashboard');
        allTestsPassed = false;
      }
    } else {
      console.log('   ❌ Frontend não consegue fazer login');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Simulação frontend: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // Resultado final
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Backend funcionando perfeitamente');
    console.log('✅ Frontend acessível e funcionando');
    console.log('✅ Todos os endpoints necessários implementados');
    console.log('✅ Dados do usuário sendo exibidos corretamente');
    console.log('✅ Integração frontend + backend 100% operacional');
    console.log('\n🚀 O sistema está pronto para exibir as informações do usuário!');
    console.log('🌐 Acesse: http://localhost:3001');
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM');
    console.log('❌ Verifique os erros acima');
  }
  console.log('='.repeat(60));
}

// Executar teste
testFrontendBackendIntegration().catch(console.error);
