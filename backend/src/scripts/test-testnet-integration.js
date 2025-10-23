/**
 * Test Script: Testnet Integration
 * 
 * Script para testar a integração completa com conta TESTNET
 * - Login com brainoschris@gmail.com / TestPassword123!
 * - Verificar detecção de testnet
 * - Testar endpoints de market data
 * - Validar dados específicos da LN Markets
 * - Verificar posições
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:13010';
const TEST_CREDENTIALS = {
  emailOrUsername: 'brainoschris@gmail.com',
  password: 'TestPassword123!'
};

let authToken = null;

async function login() {
  console.log('🔐 TESTNET INTEGRATION - Logging in...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
    authToken = response.data.token;
    
    console.log('✅ TESTNET INTEGRATION - Login successful:', {
      hasToken: !!authToken,
      tokenLength: authToken?.length
    });
    
    return true;
  } catch (error) {
    console.error('❌ TESTNET INTEGRATION - Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testMarketIndex() {
  console.log('🔄 TESTNET INTEGRATION - Testing market index...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/market/index/public`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const data = response.data.data;
    
    console.log('✅ TESTNET INTEGRATION - Market index data:', {
      index: data.index,
      tradingFees: data.tradingFees,
      nextFunding: data.nextFunding,
      rate: data.rate,
      source: data.source,
      network: data.network,
      timestamp: new Date(data.timestamp).toISOString()
    });
    
    // Validar que não são dados mockados
    if (data.tradingFees === 0.1 && data.rate === 0.00006) {
      console.warn('⚠️ TESTNET INTEGRATION - Possible hardcoded data detected');
    }
    
    return true;
  } catch (error) {
    console.error('❌ TESTNET INTEGRATION - Market index failed:', error.response?.data || error.message);
    return false;
  }
}

async function testTradingViewEnhanced() {
  console.log('🔄 TESTNET INTEGRATION - Testing TradingView enhanced...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/tradingview/index/lnmarkets`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const data = response.data.data;
    
    console.log('✅ TESTNET INTEGRATION - TradingView enhanced data:', {
      price: data.price,
      change24h: data.change24h,
      volume: data.volume,
      source: data.source,
      exchange: data.exchange,
      symbols: data.symbols,
      weights: data.weights
    });
    
    return true;
  } catch (error) {
    console.error('❌ TESTNET INTEGRATION - TradingView enhanced failed:', error.response?.data || error.message);
    return false;
  }
}

async function testLNMarketsHeader() {
  console.log('🔄 TESTNET INTEGRATION - Testing LN Markets header...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/lnmarkets/header-data`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const data = response.data.data;
    
    console.log('✅ TESTNET INTEGRATION - LN Markets header data:', {
      tradingFees: data.tradingFees,
      nextFunding: data.nextFunding,
      rate: data.rate,
      rateChange: data.rateChange,
      source: data.source,
      network: data.network,
      timestamp: new Date(data.timestamp).toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('❌ TESTNET INTEGRATION - LN Markets header failed:', error.response?.data || error.message);
    return false;
  }
}

async function testPositions() {
  console.log('🔄 TESTNET INTEGRATION - Testing positions...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/lnmarkets/positions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const positions = response.data.data;
    
    console.log('✅ TESTNET INTEGRATION - Positions data:', {
      positionCount: positions.length,
      positions: positions.map(p => ({
        id: p.id,
        side: p.side,
        size: p.size,
        entryPrice: p.entryPrice,
        markPrice: p.markPrice
      }))
    });
    
    if (positions.length !== 2) {
      console.warn(`⚠️ TESTNET INTEGRATION - Expected 2 positions, got ${positions.length}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ TESTNET INTEGRATION - Positions failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCacheStats() {
  console.log('🔄 TESTNET INTEGRATION - Testing cache stats...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/lnmarkets/header-data/cache-stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const stats = response.data.data;
    
    console.log('✅ TESTNET INTEGRATION - Cache stats:', {
      cacheSize: stats.cacheStats.size,
      cacheKeys: stats.cacheStats.keys,
      isTestnet: stats.debugInfo.isTestnet,
      credentials: stats.debugInfo.credentials
    });
    
    return true;
  } catch (error) {
    console.error('❌ TESTNET INTEGRATION - Cache stats failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 TESTNET INTEGRATION - Starting comprehensive test...');
  console.log('='.repeat(60));
  
  const results = {
    login: false,
    marketIndex: false,
    tradingViewEnhanced: false,
    lnMarketsHeader: false,
    positions: false,
    cacheStats: false
  };
  
  // 1. Login
  results.login = await login();
  if (!results.login) {
    console.error('❌ TESTNET INTEGRATION - Cannot continue without login');
    return results;
  }
  
  console.log('\n' + '='.repeat(60));
  
  // 2. Market Index
  results.marketIndex = await testMarketIndex();
  
  console.log('\n' + '='.repeat(60));
  
  // 3. TradingView Enhanced
  results.tradingViewEnhanced = await testTradingViewEnhanced();
  
  console.log('\n' + '='.repeat(60));
  
  // 4. LN Markets Header
  results.lnMarketsHeader = await testLNMarketsHeader();
  
  console.log('\n' + '='.repeat(60));
  
  // 5. Positions
  results.positions = await testPositions();
  
  console.log('\n' + '='.repeat(60));
  
  // 6. Cache Stats
  results.cacheStats = await testCacheStats();
  
  console.log('\n' + '='.repeat(60));
  
  // Summary
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log('📊 TESTNET INTEGRATION - Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  if (passed === total) {
    console.log('\n🎉 TESTNET INTEGRATION - All tests passed!');
  } else {
    console.log('\n⚠️ TESTNET INTEGRATION - Some tests failed');
  }
  
  return results;
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  login,
  testMarketIndex,
  testTradingViewEnhanced,
  testLNMarketsHeader,
  testPositions,
  testCacheStats
};
