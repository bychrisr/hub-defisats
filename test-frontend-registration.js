// Script para testar o frontend com dados únicos
const axios = require('axios');

const API_URL = 'http://localhost:13010';

async function testRegistration() {
  console.log('🧪 TESTING FRONTEND REGISTRATION WITH UNIQUE DATA');
  console.log('================================================');
  
  // Gerar dados únicos
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  const testData = {
    email: `test_${timestamp}_${random}@example.com`,
    username: `user_${timestamp}_${random}`,
    password: 'Test123!@#',
    confirmPassword: 'Test123!@#',
    ln_markets_api_key: `test_key_${timestamp}_${random}`,
    ln_markets_api_secret: `test_secret_${timestamp}_${random}`,
    ln_markets_passphrase: `testpassphrase_${timestamp}`
  };
  
  console.log('📧 Test data:', {
    email: testData.email,
    username: testData.username,
    password: '***',
    ln_markets_api_key: testData.ln_markets_api_key,
    ln_markets_api_secret: testData.ln_markets_api_secret,
    ln_markets_passphrase: testData.ln_markets_passphrase
  });
  
  try {
    // Test 1: Check email availability
    console.log('\n🔍 Step 1: Checking email availability...');
    const emailCheck = await axios.post(`${API_URL}/api/auth/check-email`, {
      email: testData.email
    });
    console.log('✅ Email check result:', emailCheck.data);
    
    // Test 2: Register user
    console.log('\n🚀 Step 2: Registering user...');
    const registration = await axios.post(`${API_URL}/api/auth/register`, testData);
    console.log('✅ Registration successful:', {
      user_id: registration.data.user_id,
      plan_type: registration.data.plan_type,
      token: registration.data.token ? 'Present' : 'Missing'
    });
    
    console.log('\n🎉 ALL TESTS PASSED! Registration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

testRegistration();
