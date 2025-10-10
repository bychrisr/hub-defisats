#!/usr/bin/env tsx

/**
 * Teste Abrangente de Autenticação LN Markets
 * 
 * Testando todas as possíveis variações de autenticação
 */

import crypto from 'crypto';
import axios from 'axios';

// Credenciais válidas da LN Markets
const VALID_CREDENTIALS = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor'
};

class ComprehensiveAuthTester {
  private credentials: typeof VALID_CREDENTIALS;

  constructor(credentials: typeof VALID_CREDENTIALS) {
    this.credentials = credentials;
  }

  /**
   * Testa diferentes algoritmos de hash
   */
  async testDifferentHashAlgorithms(): Promise<void> {
    console.log(`\n🔐 TESTANDO DIFERENTES ALGORITMOS DE HASH...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const body = '';
    const message = method + path + timestamp + body;

    const algorithms = ['sha256', 'sha1', 'md5', 'sha512', 'sha384'];
    
    for (const algorithm of algorithms) {
      try {
        console.log(`\n🧪 TESTANDO ${algorithm.toUpperCase()}...`);
        
        const hmac = crypto.createHmac(algorithm, this.credentials.secret);
        hmac.update(message);
        const signature = hmac.digest('base64');

        await this.testSignature(`${algorithm.toUpperCase()}`, signature, timestamp);
      } catch (error: any) {
        console.log(`❌ ${algorithm.toUpperCase()} - Erro:`, error.message);
      }
    }
  }

  /**
   * Testa diferentes codificações de secret
   */
  async testDifferentSecretEncodings(): Promise<void> {
    console.log(`\n🔑 TESTANDO DIFERENTES CODIFICAÇÕES DE SECRET...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const body = '';
    const message = method + path + timestamp + body;

    // Teste 1: Secret como string (atual)
    console.log(`\n🧪 TESTANDO Secret como String...`);
    const hmac1 = crypto.createHmac('sha256', this.credentials.secret);
    hmac1.update(message);
    const signature1 = hmac1.digest('base64');
    await this.testSignature('Secret String', signature1, timestamp);

    // Teste 2: Secret como Buffer
    console.log(`\n🧪 TESTANDO Secret como Buffer...`);
    const secretBuffer = Buffer.from(this.credentials.secret, 'utf8');
    const hmac2 = crypto.createHmac('sha256', secretBuffer);
    hmac2.update(message);
    const signature2 = hmac2.digest('base64');
    await this.testSignature('Secret Buffer', signature2, timestamp);

    // Teste 3: Secret decodificado de base64
    console.log(`\n🧪 TESTANDO Secret decodificado de Base64...`);
    try {
      const secretDecoded = Buffer.from(this.credentials.secret, 'base64');
      const hmac3 = crypto.createHmac('sha256', secretDecoded);
      hmac3.update(message);
      const signature3 = hmac3.digest('base64');
      await this.testSignature('Secret Base64 Decoded', signature3, timestamp);
    } catch (error: any) {
      console.log(`❌ Secret Base64 Decoded - Erro:`, error.message);
    }

    // Teste 4: Secret decodificado de hex
    console.log(`\n🧪 TESTANDO Secret decodificado de Hex...`);
    try {
      const secretHex = Buffer.from(this.credentials.secret, 'hex');
      const hmac4 = crypto.createHmac('sha256', secretHex);
      hmac4.update(message);
      const signature4 = hmac4.digest('base64');
      await this.testSignature('Secret Hex Decoded', signature4, timestamp);
    } catch (error: any) {
      console.log(`❌ Secret Hex Decoded - Erro:`, error.message);
    }
  }

  /**
   * Testa diferentes formatos de mensagem mais específicos
   */
  async testSpecificMessageFormats(): Promise<void> {
    console.log(`\n📝 TESTANDO FORMATOS ESPECÍFICOS DE MENSAGEM...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const body = '';

    // Formato 1: method + path + timestamp + body (atual)
    const message1 = method + path + timestamp + body;
    await this.testMessageFormat('Method + Path + Timestamp + Body', message1);

    // Formato 2: path + timestamp + body (sem method)
    const message2 = path + timestamp + body;
    await this.testMessageFormat('Path + Timestamp + Body', message2);

    // Formato 3: timestamp + method + path + body
    const message3 = timestamp + method + path + body;
    await this.testMessageFormat('Timestamp + Method + Path + Body', message3);

    // Formato 4: method + ' ' + path + ' ' + timestamp + body
    const message4 = method + ' ' + path + ' ' + timestamp + body;
    await this.testMessageFormat('Method + Space + Path + Space + Timestamp + Body', message4);

    // Formato 5: method + '\n' + path + '\n' + timestamp + '\n' + body
    const message5 = method + '\n' + path + '\n' + timestamp + '\n' + body;
    await this.testMessageFormat('Method + Newline + Path + Newline + Timestamp + Newline + Body', message5);

    // Formato 6: method + path + timestamp (sem body)
    const message6 = method + path + timestamp;
    await this.testMessageFormat('Method + Path + Timestamp (sem body)', message6);

    // Formato 7: path + timestamp (sem method e body)
    const message7 = path + timestamp;
    await this.testMessageFormat('Path + Timestamp (sem method e body)', message7);

    // Formato 8: method + path + timestamp + body + '\n'
    const message8 = method + path + timestamp + body + '\n';
    await this.testMessageFormat('Method + Path + Timestamp + Body + Newline', message8);
  }

  /**
   * Testa diferentes codificações de mensagem
   */
  async testDifferentMessageEncodings(): Promise<void> {
    console.log(`\n📝 TESTANDO DIFERENTES CODIFICAÇÕES DE MENSAGEM...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const body = '';
    const message = method + path + timestamp + body;

    // Teste 1: Mensagem como string (atual)
    console.log(`\n🧪 TESTANDO Mensagem como String...`);
    const hmac1 = crypto.createHmac('sha256', this.credentials.secret);
    hmac1.update(message);
    const signature1 = hmac1.digest('base64');
    await this.testSignature('Mensagem String', signature1, timestamp);

    // Teste 2: Mensagem como Buffer
    console.log(`\n🧪 TESTANDO Mensagem como Buffer...`);
    const messageBuffer = Buffer.from(message, 'utf8');
    const hmac2 = crypto.createHmac('sha256', this.credentials.secret);
    hmac2.update(messageBuffer);
    const signature2 = hmac2.digest('base64');
    await this.testSignature('Mensagem Buffer', signature2, timestamp);

    // Teste 3: Mensagem como Uint8Array
    console.log(`\n🧪 TESTANDO Mensagem como Uint8Array...`);
    const messageUint8 = new Uint8Array(Buffer.from(message, 'utf8'));
    const hmac3 = crypto.createHmac('sha256', this.credentials.secret);
    hmac3.update(messageUint8);
    const signature3 = hmac3.digest('base64');
    await this.testSignature('Mensagem Uint8Array', signature3, timestamp);
  }

  /**
   * Testa diferentes formatos de timestamp
   */
  async testDifferentTimestampFormats(): Promise<void> {
    console.log(`\n⏰ TESTANDO DIFERENTES FORMATOS DE TIMESTAMP...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const body = '';

    // Timestamp em milissegundos (atual)
    const timestampMillis = Date.now().toString();
    await this.testTimestampFormat('Milissegundos', method, path, timestampMillis, body);

    // Timestamp em segundos
    const timestampSeconds = Math.floor(Date.now() / 1000).toString();
    await this.testTimestampFormat('Segundos', method, path, timestampSeconds, body);

    // Timestamp em microssegundos
    const timestampMicros = (Date.now() * 1000).toString();
    await this.testTimestampFormat('Microssegundos', method, path, timestampMicros, body);

    // Timestamp ISO sem Z
    const timestampISO = new Date().toISOString().replace('Z', '');
    await this.testTimestampFormat('ISO sem Z', method, path, timestampISO, body);

    // Timestamp ISO com Z
    const timestampISOZ = new Date().toISOString();
    await this.testTimestampFormat('ISO com Z', method, path, timestampISOZ, body);
  }

  /**
   * Testa diferentes headers
   */
  async testDifferentHeaders(): Promise<void> {
    console.log(`\n📋 TESTANDO DIFERENTES HEADERS...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const body = '';
    const message = method + path + timestamp + body;

    const hmac = crypto.createHmac('sha256', this.credentials.secret);
    hmac.update(message);
    const signature = hmac.digest('base64');

    // Teste 1: Headers padrão
    const headers1 = {
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    await this.testHeaders('Headers Padrão', headers1);

    // Teste 2: Headers sem Content-Type
    const headers2 = {
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
      'Accept': 'application/json'
    };
    await this.testHeaders('Headers sem Content-Type', headers2);

    // Teste 3: Headers sem Accept
    const headers3 = {
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json'
    };
    await this.testHeaders('Headers sem Accept', headers3);

    // Teste 4: Headers apenas essenciais
    const headers4 = {
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp
    };
    await this.testHeaders('Headers Apenas Essenciais', headers4);

    // Teste 5: Headers com User-Agent
    const headers5 = {
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Axisor/1.0'
    };
    await this.testHeaders('Headers com User-Agent', headers5);
  }

  /**
   * Testa um formato específico de mensagem
   */
  async testMessageFormat(formatName: string, message: string): Promise<void> {
    try {
      console.log(`\n🧪 TESTANDO ${formatName}...`);
      console.log(`📝 Mensagem: ${message}`);
      
      const hmac = crypto.createHmac('sha256', this.credentials.secret);
      hmac.update(message);
      const signature = hmac.digest('base64');

      await this.testSignature(`${formatName}`, signature, Date.now().toString());
    } catch (error: any) {
      console.log(`❌ ${formatName} - Erro:`, error.message);
    }
  }

  /**
   * Testa um formato específico de timestamp
   */
  async testTimestampFormat(formatName: string, method: string, path: string, timestamp: string, body: string): Promise<void> {
    try {
      console.log(`\n🧪 TESTANDO ${formatName}...`);
      console.log(`⏰ Timestamp: ${timestamp}`);
      
      const message = method + path + timestamp + body;
      const hmac = crypto.createHmac('sha256', this.credentials.secret);
      hmac.update(message);
      const signature = hmac.digest('base64');

      await this.testSignature(`${formatName}`, signature, timestamp);
    } catch (error: any) {
      console.log(`❌ ${formatName} - Erro:`, error.message);
    }
  }

  /**
   * Testa headers específicos
   */
  async testHeaders(testName: string, headers: any): Promise<void> {
    try {
      console.log(`\n🧪 TESTANDO ${testName}...`);
      
      const response = await axios.get('https://api.lnmarkets.com/v2/futures?type=running', {
        headers,
        timeout: 10000
      });

      console.log(`✅ ${testName} - SUCESSO! Status: ${response.status}`);
      console.log(`📊 ${testName} - Dados:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.log(`❌ ${testName} - Falhou:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
  }

  /**
   * Testa uma assinatura específica
   */
  async testSignature(testName: string, signature: string, timestamp: string): Promise<void> {
    try {
      console.log(`\n🔍 TESTANDO ${testName}...`);
      
      const headers = {
        'LNM-ACCESS-KEY': this.credentials.apiKey,
        'LNM-ACCESS-SIGNATURE': signature,
        'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
        'LNM-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const response = await axios.get('https://api.lnmarkets.com/v2/futures?type=running', {
        headers,
        timeout: 10000
      });

      console.log(`✅ ${testName} - SUCESSO! Status: ${response.status}`);
      console.log(`📊 ${testName} - Dados:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.log(`❌ ${testName} - Falhou:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
  }

  /**
   * Executa todos os testes
   */
  async runAllTests(): Promise<void> {
    console.log(`\n🔬 TESTE ABRANGENTE - AUTENTICAÇÃO LN MARKETS`);
    console.log(`=============================================`);
    
    await this.testDifferentHashAlgorithms();
    await this.testDifferentSecretEncodings();
    await this.testSpecificMessageFormats();
    await this.testDifferentMessageEncodings();
    await this.testDifferentTimestampFormats();
    await this.testDifferentHeaders();

    console.log(`\n✅ TODOS OS TESTES CONCLUÍDOS`);
    console.log(`=============================`);
  }
}

// Executar todos os testes
async function main() {
  const tester = new ComprehensiveAuthTester(VALID_CREDENTIALS);
  await tester.runAllTests();
}

main().catch(console.error);
