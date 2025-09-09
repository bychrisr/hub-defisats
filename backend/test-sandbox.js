const { testSandboxCredentials } = require('./src/services/lnmarkets.service');

async function main() {
  console.log('🚀 Starting LN Markets sandbox credentials test...\n');

  try {
    await testSandboxCredentials();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }

  console.log('\n🏁 Test completed.');
}

main();