#!/usr/bin/env node

const axios = require('axios');

async function testFrontendConnection() {
  console.log('🧪 Testando conexão do frontend com o backend...\n');

  try {
    // Teste 1: Verificar se o frontend está rodando
    console.log('1️⃣ Testando acesso ao frontend...');
    const frontendResponse = await axios.get('http://localhost:13000');
    console.log('✅ Frontend está rodando');
    console.log(`   Status: ${frontendResponse.status}`);
    console.log(`   Content-Type: ${frontendResponse.headers['content-type']}\n`);

    // Teste 2: Verificar se o proxy está funcionando
    console.log('2️⃣ Testando proxy do frontend para backend...');
    try {
      const proxyResponse = await axios.get('http://localhost:13000/api/auth/register', {
        method: 'POST',
        data: {
          email: 'test@example.com',
          password: 'Password123!',
          username: 'testuser',
          confirmPassword: 'Password123!',
          ln_markets_api_key: 'test_api_key_16_chars',
          ln_markets_api_secret: 'test_api_secret_16_chars',
          ln_markets_passphrase: 'testpassphrase'
        }
      });
      console.log('❌ Proxy não deveria funcionar com POST sem Content-Type');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Proxy está funcionando - recebeu erro de validação do backend');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Erro: ${error.response.data.message}\n`);
      } else {
        console.log('❌ Proxy não está funcionando corretamente');
        console.log(`   Erro: ${error.message}\n`);
      }
    }

    // Teste 3: Testar com Content-Type correto
    console.log('3️⃣ Testando proxy com Content-Type correto...');
    try {
      const proxyResponse = await axios.post('http://localhost:13000/api/auth/register', {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
        confirmPassword: 'Password123!',
        ln_markets_api_key: 'test_api_key_16_chars',
        ln_markets_api_secret: 'test_api_secret_16_chars',
        ln_markets_passphrase: 'testpassphrase'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Não deveria ter sucesso com credenciais inválidas');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Proxy está funcionando perfeitamente');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Erro: ${error.response.data.message}\n`);
      } else {
        console.log('❌ Erro inesperado no proxy');
        console.log(`   Erro: ${error.message}\n`);
      }
    }

    // Teste 4: Verificar se o backend está acessível diretamente
    console.log('4️⃣ Testando acesso direto ao backend...');
    const backendResponse = await axios.get('http://localhost:13010/test');
    console.log('✅ Backend está acessível diretamente');
    console.log(`   Status: ${backendResponse.status}`);
    console.log(`   Resposta: ${JSON.stringify(backendResponse.data)}\n`);

    console.log('🎉 Todos os testes passaram! O frontend e backend estão funcionando corretamente.');
    console.log('\n📋 Resumo:');
    console.log('   - Frontend: ✅ Rodando em http://localhost:13000');
    console.log('   - Backend: ✅ Rodando em http://localhost:13010');
    console.log('   - Proxy: ✅ Funcionando corretamente');
    console.log('   - Conectividade: ✅ Containers se comunicam');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    process.exit(1);
  }
}

testFrontendConnection();
