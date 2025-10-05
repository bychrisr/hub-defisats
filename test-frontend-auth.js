// Teste de autenticação do frontend
const axios = require('axios');

async function testFrontendAuth() {
  try {
    console.log('🔍 Testando autenticação do frontend...');
    
    // 1. Fazer login
    console.log('📝 Fazendo login...');
    const loginResponse = await axios.post('http://localhost:13000/api/auth/login', {
      emailOrUsername: 'admin@hub-defisats.com',
      password: 'Admin123!@#'
    });
    
    console.log('✅ Login realizado:', loginResponse.data);
    const token = loginResponse.data.token;
    
    // 2. Testar plan-limits com token
    console.log('📊 Testando plan-limits...');
    const planLimitsResponse = await axios.get('http://localhost:13000/api/plan-limits', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Plan limits obtidos:', planLimitsResponse.data);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testFrontendAuth();
