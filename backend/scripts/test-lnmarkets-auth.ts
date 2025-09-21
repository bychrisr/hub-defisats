import { LNMarketsAPIService } from '../src/services/lnmarkets-api.service';

async function testLNMarketsAuth() {
  try {
    console.log('🧪 TESTING LN MARKETS AUTH - Starting authentication test...');
    
    // Test with placeholder credentials
    const credentials = {
      apiKey: 'your_api_key_here',
      apiSecret: 'your_api_secret_here', 
      passphrase: '#Lobinho123',
      isTestnet: false
    };

    console.log('📝 Testing with placeholder credentials:', {
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      passphrase: credentials.passphrase
    });

    const logger = {
      info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
      error: (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data || ''),
      warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || ''),
      debug: (msg: string, data?: any) => console.log(`[DEBUG] ${msg}`, data || '')
    };

    const lnMarketsService = new LNMarketsAPIService(credentials, logger as any);
    
    console.log('✅ LNMarketsAPIService created successfully');
    
    // Test getUserBalance (this works)
    try {
      console.log('🔍 Testing getUserBalance...');
      const balance = await lnMarketsService.getUserBalance();
      console.log('✅ getUserBalance result:', balance);
    } catch (error: any) {
      console.error('❌ getUserBalance error:', error.message);
    }
    
    // Test getUserPositions (this fails)
    try {
      console.log('🔍 Testing getUserPositions...');
      const positions = await lnMarketsService.getUserPositions();
      console.log('✅ getUserPositions result:', positions);
    } catch (error: any) {
      console.error('❌ getUserPositions error:', error.message);
      console.error('❌ getUserPositions error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing LN Markets auth:', error);
  }
}

testLNMarketsAuth();
