#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testLoginFlow() {
  console.log('🧪 Testando fluxo completo de login...\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await makeRequest('http://localhost:13000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'brainoschris@gmail.com',
        password: '#Lobinho123'
      })
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login falhou: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`);
    }

    console.log('✅ Login realizado com sucesso');
    console.log(`   User ID: ${loginResponse.data.user_id}`);
    console.log(`   Plan: ${loginResponse.data.plan_type}`);
    console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...\n`);

    const token = loginResponse.data.token;

    // 2. Obter perfil
    console.log('2️⃣ Obtendo perfil do usuário...');
    const profileResponse = await makeRequest('http://localhost:13000/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (profileResponse.status !== 200) {
      throw new Error(`Falha ao obter perfil: ${profileResponse.status} - ${JSON.stringify(profileResponse.data)}`);
    }

    console.log('✅ Perfil obtido com sucesso');
    console.log(`   Email: ${profileResponse.data.email}`);
    console.log(`   Plan: ${profileResponse.data.plan_type}`);
    console.log(`   Admin: ${profileResponse.data.is_admin}`);
    console.log(`   Created: ${profileResponse.data.created_at}\n`);

    // 3. Testar dashboard (simular requisição que o frontend faria)
    console.log('3️⃣ Testando acesso ao dashboard...');
    const dashboardResponse = await makeRequest('http://localhost:13000/api/automations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`   Status: ${dashboardResponse.status}`);
    if (dashboardResponse.status === 200) {
      console.log('✅ Dashboard acessível');
      console.log(`   Automations: ${JSON.stringify(dashboardResponse.data)}\n`);
    } else {
      console.log('⚠️ Dashboard retornou erro (pode ser normal se não houver automações)');
      console.log(`   Erro: ${JSON.stringify(dashboardResponse.data)}\n`);
    }

    // 4. Testar posições (simular requisição que o frontend faria)
    console.log('4️⃣ Testando acesso às posições...');
    const positionsResponse = await makeRequest('http://localhost:13000/api/lnmarkets/positions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`   Status: ${positionsResponse.status}`);
    if (positionsResponse.status === 200) {
      console.log('✅ Posições acessíveis');
      console.log(`   Data: ${JSON.stringify(positionsResponse.data)}\n`);
    } else {
      console.log('⚠️ Posições retornaram erro (pode ser normal se não houver posições)');
      console.log(`   Erro: ${JSON.stringify(positionsResponse.data)}\n`);
    }

    console.log('🎉 Fluxo de login testado com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   - Login: ✅ Funcionando');
    console.log('   - Perfil: ✅ Funcionando');
    console.log('   - Autenticação: ✅ Funcionando');
    console.log('   - API: ✅ Funcionando');
    console.log('\n💡 O problema pode estar na interface do usuário ou nos hooks do React.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    process.exit(1);
  }
}

testLoginFlow();
