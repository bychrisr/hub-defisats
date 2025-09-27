#!/usr/bin/env tsx

/**
 * Teste de Diferentes Formatos de Assinatura LN Markets
 * Testando todas as possibilidades baseadas na documentação
 */

import crypto from 'crypto';
import axios from 'axios';

// Credenciais válidas da LN Markets
const VALID_CREDENTIALS = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor'
};

class SignatureFormatTester {
  private credentials: typeof VALID_CREDENTIALS;

  constructor(credentials: typeof VALID_CREDENTIALS) {
    this.credentials = credentials;
  }

  /**
   * Testa diferentes formatos de string de assinatura
   */
  testSignatureFormats(method: string, path: string, timestamp: string, body: string = '') {
    console.log(`\n🔬 TESTANDO FORMATOS DE ASSINATURA`);
    console.log(`Método: ${method}, Path: ${path}, Timestamp: ${timestamp}`);
    
    const formats = [
      // Formato 1: method + path + timestamp + body
      {
        name: 'Formato 1: method + path + timestamp + body',
        message: method + path + timestamp + body
      },
      // Formato 2: method + '/v2' + path + timestamp + body
      {
        name: 'Formato 2: method + "/v2" + path + timestamp + body',
        message: method + '/v2' + path + timestamp + body
      },
      // Formato 3: method + path + timestamp + body (sem /v2 no path)
      {
        name: 'Formato 3: method + path (sem /v2) + timestamp + body',
        message: method + path.replace('/v2', '') + timestamp + body
      },
      // Formato 4: method + path + timestamp + body (com query params)
      {
        name: 'Formato 4: method + path + timestamp + body (com query)',
        message: method + path + timestamp + body
      },
      // Formato 5: method + path + timestamp + body (path sem query)
      {
        name: 'Formato 5: method + path (sem query) + timestamp + body',
        message: method + path.split('?')[0] + timestamp + body
      }
    ];

    formats.forEach((format, index) => {
      const signature = crypto
        .createHmac('sha256', this.credentials.secret)
        .update(format.message)
        .digest('base64');
      
      console.log(`\n${index + 1}. ${format.name}`);
      console.log(`   String: ${format.message}`);
      console.log(`   Assinatura: ${signature}`);
    });
  }

  /**
   * Testa endpoint com formato específico
   */
  async testEndpointWithFormat(endpoint: string, method: string, formatIndex: number): Promise<void> {
    try {
      console.log(`\n🚀 TESTANDO FORMATO ${formatIndex + 1} - ${endpoint}...`);
      
      const timestamp = Date.now().toString();
      let message = '';
      
      switch (formatIndex) {
        case 0: // Formato 1
          message = method + endpoint + timestamp;
          break;
        case 1: // Formato 2
          message = method + '/v2' + endpoint + timestamp;
          break;
        case 2: // Formato 3
          message = method + endpoint.replace('/v2', '') + timestamp;
          break;
        case 3: // Formato 4
          message = method + endpoint + timestamp;
          break;
        case 4: // Formato 5
          message = method + endpoint.split('?')[0] + timestamp;
          break;
      }
      
      const signature = crypto
        .createHmac('sha256', this.credentials.secret)
        .update(message)
        .digest('base64');
      
      const headers = {
        'LNM-ACCESS-KEY': this.credentials.apiKey,
        'LNM-ACCESS-SIGNATURE': signature,
        'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
        'LNM-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      console.log(`📝 String: ${message}`);
      console.log(`🔐 Assinatura: ${signature}`);
      
      const url = `https://api.lnmarkets.com${endpoint}`;
      const response = await axios({
        method: method.toLowerCase() as any,
        url,
        headers,
        timeout: 10000
      });

      console.log(`✅ SUCESSO! Status: ${response.status}`);
      console.log(`📊 Dados:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.error(`❌ Erro no formato ${formatIndex + 1}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
  }

  /**
   * Executa todos os testes
   */
  async runAllTests(): Promise<void> {
    console.log(`\n🔬 TESTE COMPLETO DE FORMATOS DE ASSINATURA`);
    console.log(`=============================================`);
    
    const timestamp = Date.now().toString();
    
    // Testar formatos de assinatura
    this.testSignatureFormats('GET', '/v2/user', timestamp);
    
    // Testar cada formato com endpoint real
    for (let i = 0; i < 5; i++) {
      await this.testEndpointWithFormat('/v2/user', 'GET', i);
    }

    console.log(`\n✅ TESTES DE FORMATOS CONCLUÍDOS`);
    console.log(`=================================`);
  }
}

// Executar testes
async function main() {
  const tester = new SignatureFormatTester(VALID_CREDENTIALS);
  await tester.runAllTests();
}

main().catch(console.error);
