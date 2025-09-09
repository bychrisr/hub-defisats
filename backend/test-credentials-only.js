const axios = require('axios');

async function testCredentialsOnly() {
  console.log('🧪 Testing LN Markets credentials validation only...\n');

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
    console.log('🔍 Testing basic connectivity to LN Markets API...');

    // Test basic connectivity first
    const response = await axios.get('https://api.lnmarkets.com/v2/futures/ticker', {
      timeout: 10000
    });

    console.log('✅ Basic connectivity successful!');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data preview:', JSON.stringify(response.data).substring(0, 200) + '...');

    // Now test authentication with credentials
    console.log('\n🎯 Testing authentication with sandbox credentials...');

    const timestamp = Date.now();
    const method = 'GET';
    const path = '/v2/user';
    const params = '';

    console.log('🔧 Generating signature...');
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Method: ${method}`);
    console.log(`   Path: ${path}`);
    console.log(`   Params: "${params}"`);

    // Create signature (same logic as in the service)
    const crypto = require('crypto');
    const prehashString = `${timestamp}${method}${path}${params}`;
    console.log(`   Prehash string: "${prehashString}"`);

    const signature = crypto.createHmac('sha256', sandboxCredentials.apiSecret)
      .update(prehashString)
      .digest('base64');

    console.log(`   Generated signature: ${signature}`);

    const headers = {
      'LNM-ACCESS-KEY': sandboxCredentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': sandboxCredentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp.toString(),
    };

    console.log('📡 Headers being sent:');
    console.log(`   LNM-ACCESS-KEY: ${headers['LNM-ACCESS-KEY']}`);
    console.log(`   LNM-ACCESS-SIGNATURE: ${headers['LNM-ACCESS-SIGNATURE']}`);
    console.log(`   LNM-ACCESS-PASSPHRASE: ${headers['LNM-ACCESS-PASSPHRASE']}`);
    console.log(`   LNM-ACCESS-TIMESTAMP: ${headers['LNM-ACCESS-TIMESTAMP']}`);

    console.log('📡 Making authenticated request...');
    const authResponse = await axios.get('https://api.lnmarkets.com/v2/user', {
      headers,
      timeout: 10000
    });

    console.log('✅ SUCCESS: Sandbox credentials are valid!');
    console.log('📊 Auth response status:', authResponse.status);
    console.log('📋 Auth response data:', JSON.stringify(authResponse.data, null, 2));

    return {
      success: true,
      message: 'Credentials validated successfully',
      connectivity: response.status,
      auth: authResponse.status,
      data: authResponse.data
    };

  } catch (error) {
    console.log('❌ ERROR during testing:');

    if (error.response) {
      console.log('📊 HTTP Error Status:', error.response.status);
      console.log('📋 Error Response:', JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 401) {
        console.log('🔐 Authentication failed - invalid credentials');
        return {
          success: false,
          message: 'Invalid LN Markets credentials',
          error: 'AUTH_FAILED',
          details: error.response.data
        };
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🌐 Connection refused - network issue');
      return {
        success: false,
        message: 'Cannot connect to LN Markets API',
        error: 'CONNECTION_FAILED'
      };
    } else {
      console.log('💥 Other error:', error.message);
      return {
        success: false,
        message: error.message,
        error: 'UNKNOWN_ERROR'
      };
    }
  }
}

// Run the test
testCredentialsOnly().then(result => {
  console.log('\n🏁 Test completed.');
  console.log('📊 Final result:', result ? 'SUCCESS' : 'FAILED');

  if (result) {
    console.log('✅ Credentials are valid!');
    console.log('📋 User data:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ Credentials validation failed');
    console.log('\n🔍 Possible issues:');
    console.log('   1. Invalid API credentials');
    console.log('   2. Network connectivity issues');
    console.log('   3. LN Markets API changes');
    console.log('   4. Sandbox environment issues');
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});