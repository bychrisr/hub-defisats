/**
 * Testnet Detector Utility
 * 
 * Centraliza lógica de detecção de testnet para LN Markets
 * Suporta múltiplas formas de detecção conforme implementação existente
 */

export interface TestnetDetectionResult {
  isTestnet: boolean;
  reason: string;
  detectedBy: 'flag' | 'apiKey' | 'accountName' | 'default';
  confidence: 'high' | 'medium' | 'low';
}

export interface Credentials {
  [key: string]: any;
  isTestnet?: string | boolean;
  testnet?: string | boolean;
  'API Key'?: string;
  api_key?: string;
  accountName?: string;
  account_name?: string;
}

export class TestnetDetector {
  /**
   * Detectar se credenciais são testnet
   */
  static detectTestnet(credentials: Credentials): TestnetDetectionResult {
    console.log('🔍 TESTNET DETECTOR - Analyzing credentials:', {
      hasCredentials: !!credentials,
      keys: credentials ? Object.keys(credentials) : [],
      isTestnetFlag: credentials?.isTestnet,
      testnetFlag: credentials?.testnet,
      apiKey: credentials?.['API Key'] || credentials?.api_key ? 'present' : 'missing'
    });

    // 1. PRIORIDADE: Verificar flags explícitas (mais confiável)
    if (credentials.isTestnet === 'true' || credentials.isTestnet === true) {
      console.log('✅ TESTNET DETECTOR - Detected by isTestnet flag');
      return {
        isTestnet: true,
        reason: 'Explicit isTestnet flag set to true',
        detectedBy: 'flag',
        confidence: 'high'
      };
    }

    if (credentials.testnet === 'true' || credentials.testnet === true) {
      console.log('✅ TESTNET DETECTOR - Detected by testnet flag');
      return {
        isTestnet: true,
        reason: 'Explicit testnet flag set to true',
        detectedBy: 'flag',
        confidence: 'high'
      };
    }

    // 2. Verificar padrão de API key (test_*)
    const apiKey = credentials['API Key'] || credentials.api_key;
    if (apiKey && typeof apiKey === 'string' && apiKey.startsWith('test_')) {
      console.log('✅ TESTNET DETECTOR - Detected by API key pattern');
      return {
        isTestnet: true,
        reason: 'API key starts with test_ pattern',
        detectedBy: 'apiKey',
        confidence: 'medium'
      };
    }

    // 3. Verificar nome da conta (fallback)
    const accountName = credentials.accountName || credentials.account_name;
    if (accountName && typeof accountName === 'string') {
      const lowerName = accountName.toLowerCase();
      if (lowerName.includes('test') || lowerName.includes('testnet')) {
        console.log('✅ TESTNET DETECTOR - Detected by account name pattern');
        return {
          isTestnet: true,
          reason: 'Account name contains test/testnet pattern',
          detectedBy: 'accountName',
          confidence: 'low'
        };
      }
    }

    // 4. Default para mainnet
    console.log('🌐 TESTNET DETECTOR - Defaulting to mainnet');
    return {
      isTestnet: false,
      reason: 'No testnet indicators found, defaulting to mainnet',
      detectedBy: 'default',
      confidence: 'high'
    };
  }

  /**
   * Obter URL baseada na detecção de testnet
   */
  static getBaseURL(isTestnet: boolean): string {
    const mainnetURL = 'https://api.lnmarkets.com/v2';
    const testnetURL = 'https://api.testnet4.lnmarkets.com/v2';
    
    const url = isTestnet ? testnetURL : mainnetURL;
    
    console.log('🌐 TESTNET DETECTOR - Selected URL:', {
      isTestnet,
      url,
      network: isTestnet ? 'testnet' : 'mainnet'
    });
    
    return url;
  }

  /**
   * Detectar testnet e retornar URL apropriada
   */
  static detectAndGetURL(credentials: Credentials): { url: string; isTestnet: boolean; result: TestnetDetectionResult } {
    const result = this.detectTestnet(credentials);
    const url = this.getBaseURL(result.isTestnet);
    
    return {
      url,
      isTestnet: result.isTestnet,
      result
    };
  }

  /**
   * Validar se URL é testnet
   */
  static isTestnetURL(url: string): boolean {
    const testnetPatterns = [
      'testnet4.lnmarkets.com',
      'testnet.lnmarkets.com',
      'api.testnet'
    ];
    
    return testnetPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Obter informações de debug sobre detecção
   */
  static getDebugInfo(credentials: Credentials): {
    detection: TestnetDetectionResult;
    url: string;
    debug: {
      hasCredentials: boolean;
      credentialKeys: string[];
      flags: {
        isTestnet: any;
        testnet: any;
      };
      apiKey: {
        present: boolean;
        pattern: string | null;
      };
      accountName: {
        present: boolean;
        value: string | null;
        containsTest: boolean;
      };
    };
  } {
    const detection = this.detectTestnet(credentials);
    const url = this.getBaseURL(detection.isTestnet);
    
    const apiKey = credentials['API Key'] || credentials.api_key;
    const accountName = credentials.accountName || credentials.account_name;
    
    return {
      detection,
      url,
      debug: {
        hasCredentials: !!credentials,
        credentialKeys: credentials ? Object.keys(credentials) : [],
        flags: {
          isTestnet: credentials.isTestnet,
          testnet: credentials.testnet
        },
        apiKey: {
          present: !!apiKey,
          pattern: apiKey ? (apiKey.startsWith('test_') ? 'test_*' : 'normal') : null
        },
        accountName: {
          present: !!accountName,
          value: accountName || null,
          containsTest: accountName ? accountName.toLowerCase().includes('test') : false
        }
      }
    };
  }
}
