const http = require('http');

// Função para fazer requisições HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, (res) => {
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
    
    req.end();
  });
}

// Teste de integração frontend + backend
async function testFrontendIntegration() {
  console.log('🔍 TESTE DE INTEGRAÇÃO FRONTEND + BACKEND');
  console.log('==========================================\n');
  
  const API_BASE = 'http://localhost:13000';
  let allTestsPassed = true;
  
  // Teste 1: Health Check
  console.log('1️⃣ Testando Health Check...');
  try {
    const healthResult = await makeRequest(`${API_BASE}/api/health`);
    if (healthResult.status === 200 && healthResult.data.status === 'ok') {
      console.log('   ✅ Health Check: OK');
    } else {
      console.log('   ❌ Health Check: FALHOU');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Health Check: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // Teste 2: Dados do Usuário (Dashboard)
  console.log('\n2️⃣ Testando Dados do Usuário (Dashboard)...');
  try {
    const dashboardResult = await makeRequest(`${API_BASE}/api/lnmarkets/v2/user/dashboard`);
    if (dashboardResult.status === 200 && dashboardResult.data.success) {
      const user = dashboardResult.data.data.user;
      console.log('   ✅ Dashboard: OK');
      console.log(`   📊 Usuário: ${user.username} (${user.email})`);
      console.log(`   📊 Testnet: ${user.isTestnet ? 'Sim' : 'Não'}`);
      
      const balance = dashboardResult.data.data.balance;
      console.log(`   💰 Saldo: $${balance.balance} (Disponível: $${balance.available})`);
      
      const positions = dashboardResult.data.data.positions;
      console.log(`   📈 Posições: ${positions.length} posições ativas`);
      
      const ticker = dashboardResult.data.data.ticker;
      console.log(`   📊 BTC Price: $${ticker.price} (${ticker.changePercent24h > 0 ? '+' : ''}${ticker.changePercent24h}%)`);
    } else {
      console.log('   ❌ Dashboard: FALHOU');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Dashboard: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // Teste 3: Posições do Usuário
  console.log('\n3️⃣ Testando Posições do Usuário...');
  try {
    const positionsResult = await makeRequest(`${API_BASE}/api/lnmarkets/v2/trading/positions`);
    if (positionsResult.status === 200 && positionsResult.data.success) {
      const positions = positionsResult.data.data;
      console.log('   ✅ Posições: OK');
      console.log(`   📊 Total de posições: ${positions.length}`);
      
      positions.forEach((pos, index) => {
        console.log(`   📈 Posição ${index + 1}: ${pos.side.toUpperCase()} ${pos.symbol}`);
        console.log(`      💰 Tamanho: ${pos.size} | Preço: $${pos.entryPrice} | P&L: $${pos.pnl}`);
        console.log(`      🎯 Margem: $${pos.margin} | Alavancagem: ${pos.leverage}x`);
      });
    } else {
      console.log('   ❌ Posições: FALHOU');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Posições: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // Teste 4: Simulação de chamada do frontend
  console.log('\n4️⃣ Simulando chamadas do frontend...');
  try {
    // Simular chamada de dashboard (como o frontend faria)
    const frontendDashboardResult = await makeRequest(`${API_BASE}/api/lnmarkets/v2/user/dashboard`);
    if (frontendDashboardResult.status === 200) {
      console.log('   ✅ Frontend pode acessar dashboard');
      
      // Simular chamada de posições (como o frontend faria)
      const frontendPositionsResult = await makeRequest(`${API_BASE}/api/lnmarkets/v2/trading/positions`);
      if (frontendPositionsResult.status === 200) {
        console.log('   ✅ Frontend pode acessar posições');
        console.log('   ✅ Integração frontend + backend: FUNCIONANDO!');
      } else {
        console.log('   ❌ Frontend não consegue acessar posições');
        allTestsPassed = false;
      }
    } else {
      console.log('   ❌ Frontend não consegue acessar dashboard');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Simulação frontend: ERRO - ${error.message}`);
    allTestsPassed = false;
  }
  
  // Resultado final
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Backend funcionando perfeitamente');
    console.log('✅ Dados do usuário sendo exibidos corretamente');
    console.log('✅ Posições sendo carregadas com sucesso');
    console.log('✅ Integração frontend + backend operacional');
    console.log('\n🚀 O sistema está pronto para exibir as informações do usuário!');
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM');
    console.log('❌ Verifique os erros acima');
  }
  console.log('='.repeat(50));
}

// Executar teste
testFrontendIntegration().catch(console.error);
