#!/usr/bin/env tsx

/**
 * Teste de Diferentes Codificações - Base64 vs Hex
 * 
 * Testando diferentes formatos de codificação da assinatura HMAC
 */

import crypto from 'crypto';
import axios from 'axios';

// Credenciais válidas da LN Markets
const VALID_CREDENTIALS = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor'
};

class EncodingTester {
  private credentials: typeof VALID_CREDENTIALS;

  constructor(credentials: typeof VALID_CREDENTIALS) {
    this.credentials = credentials;
  }

  /**
   * Testa diferentes codificações de assinatura
   */
  async testDifferentEncodings(): Promise<void> {
    console.log(`\n🔐 TESTANDO DIFERENTES CODIFICAÇÕES DE ASSINATURA...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const body = '';
    const message = method + path + timestamp + body;

    console.log(`📝 Mensagem: ${message}`);
    console.log(`🔑 Secret: ${this.credentials.secret.substring(0, 20)}...`);

    // Gerar HMAC
    const hmac = crypto.createHmac('sha256', this.credentials.secret);
    hmac.update(message);
    const hmacBuffer = hmac.digest();

    // Teste 1: Base64 (atual)
    const signatureBase64 = hmacBuffer.toString('base64');
    console.log(`\n📊 TESTE 1 - Base64:`);
    console.log(`🔐 Assinatura Base64: ${signatureBase64}`);
    await this.testSignature('Base64', signatureBase64, timestamp);

    // Teste 2: Hex
    const signatureHex = hmacBuffer.toString('hex');
    console.log(`\n📊 TESTE 2 - Hex:`);
    console.log(`🔐 Assinatura Hex: ${signatureHex}`);
    await this.testSignature('Hex', signatureHex, timestamp);

    // Teste 3: Base64URL
    const signatureBase64URL = hmacBuffer.toString('base64url');
    console.log(`\n📊 TESTE 3 - Base64URL:`);
    console.log(`🔐 Assinatura Base64URL: ${signatureBase64URL}`);
    await this.testSignature('Base64URL', signatureBase64URL, timestamp);

    // Teste 4: Binary
    const signatureBinary = hmacBuffer.toString('binary');
    console.log(`\n📊 TESTE 4 - Binary:`);
    console.log(`🔐 Assinatura Binary: ${signatureBinary.substring(0, 20)}...`);
    await this.testSignature('Binary', signatureBinary, timestamp);

    // Teste 5: Uint8Array to Base64
    const signatureUint8Base64 = Buffer.from(hmacBuffer).toString('base64');
    console.log(`\n📊 TESTE 5 - Uint8Array to Base64:`);
    console.log(`🔐 Assinatura Uint8Base64: ${signatureUint8Base64}`);
    await this.testSignature('Uint8Base64', signatureUint8Base64, timestamp);
  }

  /**
   * Testa diferentes formatos de string de mensagem
   */
  async testDifferentMessageFormats(): Promise<void> {
    console.log(`\n📝 TESTANDO DIFERENTES FORMATOS DE MENSAGEM...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const body = '';

    // Formato 1: method + path + timestamp + body
    const message1 = method + path + timestamp + body;
    console.log(`📝 Formato 1: ${message1}`);
    await this.testMessageFormat('Formato 1', message1);

    // Formato 2: method + '/v2' + path + timestamp + body
    const message2 = method + '/v2' + path + timestamp + body;
    console.log(`📝 Formato 2: ${message2}`);
    await this.testMessageFormat('Formato 2', message2);

    // Formato 3: path + timestamp + body (sem method)
    const message3 = path + timestamp + body;
    console.log(`📝 Formato 3: ${message3}`);
    await this.testMessageFormat('Formato 3', message3);

    // Formato 4: timestamp + method + path + body
    const message4 = timestamp + method + path + body;
    console.log(`📝 Formato 4: ${message4}`);
    await this.testMessageFormat('Formato 4', message4);

    // Formato 5: method + ' ' + path + timestamp + body (com espaço)
    const message5 = method + ' ' + path + timestamp + body;
    console.log(`📝 Formato 5: ${message5}`);
    await this.testMessageFormat('Formato 5', message5);
  }

  /**
   * Testa um formato específico de mensagem
   */
  async testMessageFormat(formatName: string, message: string): Promise<void> {
    try {
      console.log(`\n🧪 TESTANDO ${formatName}...`);
      
      // Gerar HMAC com diferentes codificações
      const hmac = crypto.createHmac('sha256', this.credentials.secret);
      hmac.update(message);
      const hmacBuffer = hmac.digest();

      // Testar Base64
      const signatureBase64 = hmacBuffer.toString('base64');
      await this.testSignature(`${formatName} - Base64`, signatureBase64, Date.now().toString());

      // Testar Hex
      const signatureHex = hmacBuffer.toString('hex');
      await this.testSignature(`${formatName} - Hex`, signatureHex, Date.now().toString());

    } catch (error: any) {
      console.log(`❌ ${formatName} - Erro:`, error.message);
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
   * Testa com diferentes timestamps
   */
  async testDifferentTimestamps(): Promise<void> {
    console.log(`\n⏰ TESTANDO DIFERENTES FORMATOS DE TIMESTAMP...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const body = '';

    // Timestamp em segundos
    const timestampSeconds = Math.floor(Date.now() / 1000).toString();
    console.log(`⏰ Timestamp em segundos: ${timestampSeconds}`);
    await this.testTimestampFormat('Segundos', method, path, timestampSeconds, body);

    // Timestamp em milissegundos
    const timestampMillis = Date.now().toString();
    console.log(`⏰ Timestamp em milissegundos: ${timestampMillis}`);
    await this.testTimestampFormat('Milissegundos', method, path, timestampMillis, body);

    // Timestamp ISO
    const timestampISO = new Date().toISOString();
    console.log(`⏰ Timestamp ISO: ${timestampISO}`);
    await this.testTimestampFormat('ISO', method, path, timestampISO, body);
  }

  /**
   * Testa um formato específico de timestamp
   */
  async testTimestampFormat(formatName: string, method: string, path: string, timestamp: string, body: string): Promise<void> {
    try {
      console.log(`\n🧪 TESTANDO ${formatName}...`);
      
      const message = method + path + timestamp + body;
      const hmac = crypto.createHmac('sha256', this.credentials.secret);
      hmac.update(message);
      const signature = hmac.digest('base64');

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

      console.log(`✅ ${formatName} - SUCESSO! Status: ${response.status}`);
      console.log(`📊 ${formatName} - Dados:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.log(`❌ ${formatName} - Falhou:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
  }

  /**
   * Executa todos os testes
   */
  async runAllTests(): Promise<void> {
    console.log(`\n🔬 TESTE COMPLETO - CODIFICAÇÕES E FORMATOS`);
    console.log(`============================================`);
    
    await this.testDifferentEncodings();
    await this.testDifferentMessageFormats();
    await this.testDifferentTimestamps();

    console.log(`\n✅ TODOS OS TESTES CONCLUÍDOS`);
    console.log(`=============================`);
  }
}

// Executar todos os testes
async function main() {
  const tester = new EncodingTester(VALID_CREDENTIALS);
  await tester.runAllTests();
}

main().catch(console.error);
