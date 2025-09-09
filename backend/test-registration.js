const axios = require('axios');

async function testRegistration() {
  console.log('🧪 Testing complete registration with sandbox credentials...\n');

  const registrationData = {
    email: `test-${Date.now()}@hubdefisats.com`,
    password: 'TestPassword123!',
    ln_markets_api_key: 'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
    ln_markets_api_secret: 'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
    ln_markets_passphrase: 'a6c1bh56jc33',
    coupon_code: 'ALPHATESTER'
  };

  console.log('📋 Registration data:');
  console.log(`   Email: ${registrationData.email}`);
  console.log(`   API Key: ${registrationData.ln_markets_api_key.substring(0, 20)}...`);
  console.log(`   API Secret: ${registrationData.ln_markets_api_secret.substring(0, 20)}...`);
  console.log(`   Passphrase: ${registrationData.ln_markets_passphrase}`);
  console.log(`   Coupon: ${registrationData.coupon_code}\n`);

  try {
    console.log('🚀 Sending registration request to http://localhost:3010/api/auth/register...');

    const response = await axios.post('http://localhost:3010/api/auth/register', registrationData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    console.log('✅ Registration successful!');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));

    return {
      success: true,
      status: response.status,
      data: response.data
    };

  } catch (error) {
    console.log('❌ Registration failed!');
    console.log('📊 Error status:', error.response?.status);
    console.log('📋 Error data:', JSON.stringify(error.response?.data, null, 2));
    console.log('💬 Error message:', error.message);

    if (error.response?.data?.validation_errors) {
      console.log('🔍 Validation errors:');
      error.response.data.validation_errors.forEach(err => {
        console.log(`   - ${err.field}: ${err.message}`);
      });
    }

    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data,
      message: error.message
    };
  }
}

// Run the test
testRegistration().then(result => {
  console.log('\n🏁 Test completed.');
  console.log('📊 Final result:', result.success ? 'SUCCESS' : 'FAILED');

  if (!result.success) {
    console.log('💡 Next steps:');
    console.log('   1. Check if backend server is running on port 3010');
    console.log('   2. Verify database connection');
    console.log('   3. Check LN Markets API connectivity');
    console.log('   4. Review error logs for specific issues');
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});