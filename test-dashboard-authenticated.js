// Script para testar o carregamento do dashboard com autenticação
const axios = require('axios');

const API_BASE = 'http://localhost:13000/api';

async function testDashboardAuthenticated() {
  try {
    console.log('🔐 Testando dashboard com autenticação...');
    
    // 1. Fazer login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'brainoschris@gmail.com',
      password: 'TestPassword123!'
    });
    
    const { token } = loginResponse.data;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Simular carregamento do dashboard
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('📊 Carregando dados do dashboard...');
    
    // Carregar todos os dados em paralelo (como o frontend faz)
    const [balanceResponse, positionsResponse, estimatedResponse, marketResponse] = await Promise.allSettled([
      axios.get(`${API_BASE}/lnmarkets/user/balance`, { headers }),
      axios.get(`${API_BASE}/lnmarkets/user/positions`, { headers }),
      axios.get(`${API_BASE}/lnmarkets/user/estimated-balance`, { headers }),
      axios.get(`${API_BASE}/market/index/public`)
    ]);
    
    // Processar respostas
    const balance = balanceResponse.status === 'fulfilled' ? balanceResponse.value.data.data : null;
    const positions = positionsResponse.status === 'fulfilled' ? positionsResponse.value.data.data : [];
    const estimated = estimatedResponse.status === 'fulfilled' ? estimatedResponse.value.data.data : null;
    const market = marketResponse.status === 'fulfilled' ? marketResponse.value.data : null;
    
    console.log('📊 Dados carregados:');
    console.log('💰 Balance:', balance?.balance || 'N/A');
    console.log('📈 Estimated Balance:', estimated?.estimated_balance || 'N/A');
    console.log('📋 Positions:', positions.length);
    console.log('📊 Market Index:', market?.index || 'N/A');
    
    // Simular cálculo dos cards do dashboard
    const totalPL = estimated?.total_pnl || 0;
    const estimatedProfit = estimated?.estimated_balance || 0;
    const totalMargin = estimated?.total_margin || 0;
    const estimatedFees = estimated?.total_fees || 0;
    const availableMargin = balance?.available_balance || 0;
    const totalInvested = estimated?.total_invested || 0;
    const netProfit = estimated?.total_pnl || 0;
    const feesPaid = estimated?.total_fees || 0;
    
    console.log('🎯 Cards do Dashboard:');
    console.log('Total PL:', totalPL);
    console.log('Estimated Profit:', estimatedProfit);
    console.log('Active Trades:', positions.filter(p => Object.keys(p).length > 0).length);
    console.log('Total Margin:', totalMargin);
    console.log('Estimated Fees:', estimatedFees);
    console.log('Available Margin:', availableMargin);
    console.log('Estimated Balance:', estimatedBalance);
    console.log('Total Invested:', totalInvested);
    console.log('Net Profit:', netProfit);
    console.log('Fees Paid:', feesPaid);
    
    console.log('✅ Dashboard carregado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testDashboardAuthenticated();
