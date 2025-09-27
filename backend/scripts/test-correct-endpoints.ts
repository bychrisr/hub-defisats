#!/usr/bin/env tsx

/**
 * TESTE COM ENDPOINTS CORRETOS DA LN MARKETS
 * 
 * Usando os endpoints que funcionavam no commit antigo
 */

import axios from 'axios';

class CorrectEndpointsTester {
  private credentials = {
    apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
    secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
    passphrase: '#PassCursor'
  };

  /**
   * Testa endpoint que funcionava no commit antigo
   */
  async testWorkingEndpoint(): Promise<void> {
    console.log('🎯 TESTANDO ENDPOINT QUE FUNCIONAVA NO COMMIT ANTIGO');
    console.log('==================================================');

    try {
      // Endpoint que funcionava: /v2/user (não /v2/futures)
      const endpoint = 'https://api.lnmarkets.com/v2/user';
      const method = 'GET';
      const path = '/v2/user';
      const timestamp = Date.now().toString();
      const params = '';

      // Formato que funcionava: timestamp + method + path + params
      const message = timestamp + method + path + params;
      
      console.log(`\n🧪 TESTANDO: ${endpoint}`);
      console.log(`📝 Mensagem: "${message}"`);

      // Gerar assinatura
      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha256', this.credentials.secret);
      hmac.update(message, 'utf8');
      const signature = hmac.digest('base64');

      console.log(`🔐 Assinatura: ${signature.substring(0, 20)}...`);

      // Fazer requisição
      const response = await axios.get(endpoint, {
        headers: {
          'LNM-ACCESS-KEY': this.credentials.apiKey,
          'LNM-ACCESS-SIGNATURE': signature,
          'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
          'LNM-ACCESS-TIMESTAMP': timestamp,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ SUCESSO! Status: ${response.status}`);
      console.log(`📊 Dados:`, JSON.stringify(response.data, null, 2));

    } catch (error: any) {
      console.log(`❌ FALHOU! Status: ${error.response?.status}`);
      console.log(`📝 Erro: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Testa diferentes endpoints da LN Markets
   */
  async testDifferentEndpoints(): Promise<void> {
    console.log('\n🎯 TESTANDO DIFERENTES ENDPOINTS DA LN MARKETS');
    console.log('===============================================');

    const endpoints = [
      { url: 'https://api.lnmarkets.com/v2/user', path: '/v2/user', method: 'GET' },
      { url: 'https://api.lnmarkets.com/v2/futures', path: '/v2/futures', method: 'GET' },
      { url: 'https://api.lnmarkets.com/v2/futures?type=running', path: '/v2/futures?type=running', method: 'GET' },
      { url: 'https://api.lnmarkets.com/v2/futures?type=closed', path: '/v2/futures?type=closed', method: 'GET' },
      { url: 'https://api.lnmarkets.com/v2/options', path: '/v2/options', method: 'GET' },
      { url: 'https://api.lnmarkets.com/v2/ticker', path: '/v2/ticker', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n🧪 TESTANDO: ${endpoint.url}`);
        
        const timestamp = Date.now().toString();
        const params = endpoint.path.includes('?') ? endpoint.path.split('?')[1] : '';
        const path = endpoint.path.includes('?') ? endpoint.path.split('?')[0] : endpoint.path;
        
        // Formato que funcionava: timestamp + method + path + params
        const message = timestamp + endpoint.method + path + params;
        
        console.log(`📝 Mensagem: "${message}"`);

        // Gerar assinatura
        const crypto = await import('crypto');
        const hmac = crypto.createHmac('sha256', this.credentials.secret);
        hmac.update(message, 'utf8');
        const signature = hmac.digest('base64');

        console.log(`🔐 Assinatura: ${signature.substring(0, 20)}...`);

        // Fazer requisição
        const response = await axios.get(endpoint.url, {
          headers: {
            'LNM-ACCESS-KEY': this.credentials.apiKey,
            'LNM-ACCESS-SIGNATURE': signature,
            'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
            'LNM-ACCESS-TIMESTAMP': timestamp,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ SUCESSO! Status: ${response.status}`);
        console.log(`📊 Dados:`, JSON.stringify(response.data, null, 2));

      } catch (error: any) {
        console.log(`❌ FALHOU! Status: ${error.response?.status}`);
        console.log(`📝 Erro: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  /**
   * Executa todos os testes
   */
  async runAllTests(): Promise<void> {
    await this.testWorkingEndpoint();
    await this.testDifferentEndpoints();
    
    console.log('\n✅ TESTE COM ENDPOINTS CORRETOS CONCLUÍDO');
  }
}

// Executar testes
async function main() {
  const tester = new CorrectEndpointsTester();
  await tester.runAllTests();
}

main().catch(console.error);
