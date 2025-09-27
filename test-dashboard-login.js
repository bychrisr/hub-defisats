// Script para testar login e carregamento dos dados do dashboard
const axios = require('axios');

const API_BASE = 'http://localhost:13000/api';

async function testDashboardLogin() {
  try {
    console.log('🔐 Testando login...');
    
    // 1. Fazer login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'brainoschris@gmail.com',
      password: 'TestPassword123!'
    });
    
    const { token } = loginResponse.data;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Testar APIs do dashboard
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('📊 Testando APIs do dashboard...');
    
    // Testar balance
    const balanceResponse = await axios.get(`${API_BASE}/lnmarkets/user/balance`, { headers });
    console.log('💰 Balance:', balanceResponse.data.data.balance);
    
    // Testar estimated-balance
    const estimatedResponse = await axios.get(`${API_BASE}/lnmarkets/user/estimated-balance`, { headers });
    console.log('📈 Estimated Balance:', estimatedResponse.data.data.estimated_balance);
    
    // Testar positions
    const positionsResponse = await axios.get(`${API_BASE}/lnmarkets/user/positions`, { headers });
    console.log('📋 Positions count:', positionsResponse.data.data.length);
    
    // Testar market index
    const marketResponse = await axios.get(`${API_BASE}/market/index/public`);
    console.log('📊 Market Index:', marketResponse.data.index);
    
    console.log('✅ Todas as APIs estão funcionando!');
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testDashboardLogin();
