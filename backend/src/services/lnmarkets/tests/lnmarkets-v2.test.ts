/**
 * LN Markets API v2 - Test Suite
 * 
 * Testes com credenciais reais para validação completa
 */

import { LNMarketsAPIv2, LNMarketsCredentials } from '../LNMarketsAPIv2.service';
import { Logger } from 'winston';

// Credenciais reais para teste (brainoschris@gmail.com)
const C1_MAIN_CREDENTIALS: LNMarketsCredentials = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  apiSecret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor',
  isTestnet: false
};

const C2_TEST_CREDENTIALS: LNMarketsCredentials = {
  apiKey: '8N0ZtEaY...', // Credentials da C2 - Test
  apiSecret: '...',
  passphrase: '...',
  isTestnet: false
};

// Mock logger
const mockLogger: Logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.log(`[DEBUG] ${message}`, meta || ''),
} as any;

async function testC1MainAccount() {
  console.log('\n🧪 Testing C1 - Main Account (Expected: 3,567 sats)');
  
  const api = new LNMarketsAPIv2({
    credentials: C1_MAIN_CREDENTIALS,
    logger: mockLogger
  });

  try {
    // Test authentication
    const authResult = await api.testAuthentication();
    console.log('✅ Authentication:', authResult);

    // Get user data
    const user = await api.user.getUser();
    console.log('💰 User Balance:', user.balance);
    console.log('👤 Username:', user.username);

    // Get positions
    const positions = await api.futures.getRunningPositions();
    console.log('📊 Positions:', positions.length);

    // Get ticker
    const ticker = await api.market.getTicker();
    console.log('📈 Current Price:', ticker.lastPrice);

    return {
      success: true,
      balance: user.balance,
      positions: positions.length,
      price: ticker.lastPrice
    };
  } catch (error: any) {
    console.error('❌ C1 Main Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testC2TestAccount() {
  console.log('\n🧪 Testing C2 - Test Account (Expected: 0 sats)');
  
  const api = new LNMarketsAPIv2({
    credentials: C2_TEST_CREDENTIALS,
    logger: mockLogger
  });

  try {
    // Test authentication
    const authResult = await api.testAuthentication();
    console.log('✅ Authentication:', authResult);

    // Get user data
    const user = await api.user.getUser();
    console.log('💰 User Balance:', user.balance);

    return {
      success: true,
      balance: user.balance
    };
  } catch (error: any) {
    console.error('❌ C2 Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 LN Markets API v2 - Complete Test Suite');
  console.log('==========================================');

  const results = {
    c1Main: await testC1MainAccount(),
    c2Test: await testC2TestAccount()
  };

  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  console.log('C1 - Main:', results.c1Main);
  console.log('C2 - Test:', results.c2Test);

  return results;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { testC1MainAccount, testC2TestAccount, runAllTests };
