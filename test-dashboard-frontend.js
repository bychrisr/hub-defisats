// Script para testar o carregamento do dashboard no frontend
const axios = require('axios');

const API_BASE = 'http://localhost:13000/api';

async function testDashboardFrontend() {
  try {
    console.log('🌐 Testando carregamento do dashboard...');
    
    // 1. Verificar se o frontend está acessível
    const frontendResponse = await axios.get('http://localhost:13000/');
    console.log('✅ Frontend acessível');
    
    // 2. Verificar se as APIs estão acessíveis
    const versionResponse = await axios.get(`${API_BASE}/version`);
    console.log('✅ API Version:', versionResponse.data.version);
    
    // 3. Verificar se há problemas de CORS
    try {
      const balanceResponse = await axios.get(`${API_BASE}/lnmarkets/user/balance`);
      console.log('❌ API balance acessível sem autenticação (problema de segurança)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ API balance protegida corretamente (401 Unauthorized)');
      } else {
        console.log('❌ Erro inesperado na API balance:', error.message);
      }
    }
    
    // 4. Verificar se há problemas de proxy
    try {
      const marketResponse = await axios.get(`${API_BASE}/market/index/public`);
      console.log('✅ Market API acessível via proxy');
    } catch (error) {
      console.log('❌ Erro na Market API:', error.message);
    }
    
    console.log('✅ Teste do frontend concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testDashboardFrontend();
