#!/usr/bin/env tsx

/**
 * Teste com Formato Correto da LN Markets
 * 
 * Implementando o formato oficial: timestamp + method + path + params
 */

import crypto from 'crypto';
import axios from 'axios';

// Credenciais válidas da LN Markets
const VALID_CREDENTIALS = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor'
};

class CorrectFormatTester {
  private credentials: typeof VALID_CREDENTIALS;

  constructor(credentials: typeof VALID_CREDENTIALS) {
    this.credentials = credentials;
  }

  /**
   * Testa o formato correto: timestamp + method + path + params
   */
  async testCorrectFormat(): Promise<void> {
    console.log(`\n✅ TESTANDO FORMATO CORRETO DA LN MARKETS...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const params = ''; // Para GET, params é string vazia
    
    // Formato correto: timestamp + method + path + params
    const prehashString = timestamp + method + path + params;
    
    console.log(`📝 String pré-hash: ${prehashString}`);
    console.log(`🔑 Secret: ${this.credentials.secret.substring(0, 20)}...`);
    
    // Gerar HMAC SHA-256
    const hmac = crypto.createHmac('sha256', this.credentials.secret);
    hmac.update(prehashString);
    const signature = hmac.digest('base64');
    
    console.log(`🔐 Assinatura: ${signature}`);
    
    // Testar a assinatura
    await this.testSignature('Formato Correto', signature, timestamp);
  }

  /**
   * Testa diferentes variações do formato correto
   */
  async testFormatVariations(): Promise<void> {
    console.log(`\n🧪 TESTANDO VARIAÇÕES DO FORMATO CORRETO...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const params = '';

    // Variação 1: timestamp + method + path + params (oficial)
    const prehash1 = timestamp + method + path + params;
    await this.testPrehashString('timestamp + method + path + params', prehash1, timestamp);

    // Variação 2: timestamp + method + path (sem params)
    const prehash2 = timestamp + method + path;
    await this.testPrehashString('timestamp + method + path', prehash2, timestamp);

    // Variação 3: timestamp + method + path + params (com espaço)
    const prehash3 = timestamp + method + path + params + ' ';
    await this.testPrehashString('timestamp + method + path + params + espaço', prehash3, timestamp);

    // Variação 4: timestamp + method + path + params (com newline)
    const prehash4 = timestamp + method + path + params + '\n';
    await this.testPrehashString('timestamp + method + path + params + newline', prehash4, timestamp);
  }

  /**
   * Testa diferentes codificações de secret
   */
  async testSecretEncodings(): Promise<void> {
    console.log(`\n🔑 TESTANDO DIFERENTES CODIFICAÇÕES DE SECRET...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const params = '';
    const prehashString = timestamp + method + path + params;

    // Teste 1: Secret como string (atual)
    console.log(`\n🧪 TESTANDO Secret como String...`);
    const hmac1 = crypto.createHmac('sha256', this.credentials.secret);
    hmac1.update(prehashString);
    const signature1 = hmac1.digest('base64');
    await this.testSignature('Secret String', signature1, timestamp);

    // Teste 2: Secret como Buffer UTF-8
    console.log(`\n🧪 TESTANDO Secret como Buffer UTF-8...`);
    const secretBuffer = Buffer.from(this.credentials.secret, 'utf8');
    const hmac2 = crypto.createHmac('sha256', secretBuffer);
    hmac2.update(prehashString);
    const signature2 = hmac2.digest('base64');
    await this.testSignature('Secret Buffer UTF-8', signature2, timestamp);

    // Teste 3: Secret decodificado de Base64
    console.log(`\n🧪 TESTANDO Secret decodificado de Base64...`);
    try {
      const secretDecoded = Buffer.from(this.credentials.secret, 'base64');
      const hmac3 = crypto.createHmac('sha256', secretDecoded);
      hmac3.update(prehashString);
      const signature3 = hmac3.digest('base64');
      await this.testSignature('Secret Base64 Decoded', signature3, timestamp);
    } catch (error: any) {
      console.log(`❌ Secret Base64 Decoded - Erro:`, error.message);
    }

    // Teste 4: Secret decodificado de Base64 e convertido para string
    console.log(`\n🧪 TESTANDO Secret Base64 -> String...`);
    try {
      const secretDecoded = Buffer.from(this.credentials.secret, 'base64').toString('utf8');
      const hmac4 = crypto.createHmac('sha256', secretDecoded);
      hmac4.update(prehashString);
      const signature4 = hmac4.digest('base64');
      await this.testSignature('Secret Base64 -> String', signature4, timestamp);
    } catch (error: any) {
      console.log(`❌ Secret Base64 -> String - Erro:`, error.message);
    }
  }

  /**
   * Testa diferentes codificações de mensagem
   */
  async testMessageEncodings(): Promise<void> {
    console.log(`\n📝 TESTANDO DIFERENTES CODIFICAÇÕES DE MENSAGEM...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const params = '';
    const prehashString = timestamp + method + path + params;

    // Teste 1: Mensagem como string (atual)
    console.log(`\n🧪 TESTANDO Mensagem como String...`);
    const hmac1 = crypto.createHmac('sha256', this.credentials.secret);
    hmac1.update(prehashString);
    const signature1 = hmac1.digest('base64');
    await this.testSignature('Mensagem String', signature1, timestamp);

    // Teste 2: Mensagem como Buffer UTF-8
    console.log(`\n🧪 TESTANDO Mensagem como Buffer UTF-8...`);
    const messageBuffer = Buffer.from(prehashString, 'utf8');
    const hmac2 = crypto.createHmac('sha256', this.credentials.secret);
    hmac2.update(messageBuffer);
    const signature2 = hmac2.digest('base64');
    await this.testSignature('Mensagem Buffer UTF-8', signature2, timestamp);

    // Teste 3: Mensagem como Uint8Array
    console.log(`\n🧪 TESTANDO Mensagem como Uint8Array...`);
    const messageUint8 = new Uint8Array(Buffer.from(prehashString, 'utf8'));
    const hmac3 = crypto.createHmac('sha256', this.credentials.secret);
    hmac3.update(messageUint8);
    const signature3 = hmac3.digest('base64');
    await this.testSignature('Mensagem Uint8Array', signature3, timestamp);
  }

  /**
   * Testa diferentes algoritmos de hash
   */
  async testHashAlgorithms(): Promise<void> {
    console.log(`\n🔐 TESTANDO DIFERENTES ALGORITMOS DE HASH...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const params = '';
    const prehashString = timestamp + method + path + params;

    const algorithms = ['sha256', 'sha1', 'md5', 'sha512', 'sha384'];
    
    for (const algorithm of algorithms) {
      try {
        console.log(`\n🧪 TESTANDO ${algorithm.toUpperCase()}...`);
        
        const hmac = crypto.createHmac(algorithm, this.credentials.secret);
        hmac.update(prehashString);
        const signature = hmac.digest('base64');

        await this.testSignature(`${algorithm.toUpperCase()}`, signature, timestamp);
      } catch (error: any) {
        console.log(`❌ ${algorithm.toUpperCase()} - Erro:`, error.message);
      }
    }
  }

  /**
   * Testa uma string pré-hash específica
   */
  async testPrehashString(testName: string, prehashString: string, timestamp: string): Promise<void> {
    try {
      console.log(`\n🧪 TESTANDO ${testName}...`);
      console.log(`📝 String pré-hash: ${prehashString}`);
      
      const hmac = crypto.createHmac('sha256', this.credentials.secret);
      hmac.update(prehashString);
      const signature = hmac.digest('base64');

      await this.testSignature(`${testName}`, signature, timestamp);
    } catch (error: any) {
      console.log(`❌ ${testName} - Erro:`, error.message);
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
    console.log(`\n🔬 TESTE COM FORMATO CORRETO DA LN MARKETS`);
    console.log(`==========================================`);
    
    await this.testCorrectFormat();
    await this.testFormatVariations();
    await this.testSecretEncodings();
    await this.testMessageEncodings();
    await this.testHashAlgorithms();

    console.log(`\n✅ TODOS OS TESTES CONCLUÍDOS`);
    console.log(`=============================`);
  }
}

// Executar todos os testes
async function main() {
  const tester = new CorrectFormatTester(VALID_CREDENTIALS);
  await tester.runAllTests();
}

main().catch(console.error);
