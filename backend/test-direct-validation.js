const { createLNMarketsService } = require('./src/services/lnmarkets.service');

async function testDirectValidation() {
  console.log('🧪 Testing LN Markets credentials validation directly...\n');

  const sandboxCredentials = {
    apiKey: 'Nh8ZdEZtez7ZueIM7wMChr7M+5ohB5MLw3vrXOMUe2s=',
    apiSecret: 'J/OIBsEO/PYNi0mTWGk3gA3jZohtojMKNoYKcdjrlu4LxLo/Xk+vemAq/Z47NWlzrcYwBVLgWaEHMvITHJsMuA==',
    passphrase: 'be6931d8gfdi6',
  };

  console.log('📋 Testing credentials:');
  console.log(`   API Key: ${sandboxCredentials.apiKey.substring(0, 20)}...`);
  console.log(`   API Secret: ${sandboxCredentials.apiSecret.substring(0, 20)}...`);
  console.log(`   Passphrase: ${sandboxCredentials.passphrase}`);
  console.log('');

  try {
    console.log('🔍 Creating LN Markets service...');
    const service = createLNMarketsService(sandboxCredentials);

    console.log('🎯 Testing credentials validation...');
    const isValid = await service.validateCredentials();

    if (isValid) {
      console.log('✅ SUCCESS: LN Markets credentials are valid!');
      console.log('🎉 The authentication is working correctly!');
      return { success: true, message: 'Credentials validated successfully' };
    } else {
      console.log('❌ FAILURE: LN Markets credentials validation failed');
      return { success: false, message: 'Credentials validation failed' };
    }

  } catch (error) {
    console.log('❌ ERROR during validation:', error.message);
    console.log('📋 Full error:', error);
    return { success: false, message: error.message, error: error };
  }
}

// Run the test
testDirectValidation().then(result => {
  console.log('\n🏁 Test completed.');
  console.log('📊 Final result:', result.success ? 'SUCCESS' : 'FAILED');

  if (result.success) {
    console.log('🎉 LN Markets integration is working perfectly!');
    console.log('✅ Authentication HMAC-SHA256 is correct');
    console.log('✅ API endpoints are accessible');
    console.log('✅ Credentials are valid');
  } else {
    console.log('❌ There is still an issue with the LN Markets integration');
    console.log('💡 Check the error message above for details');
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});