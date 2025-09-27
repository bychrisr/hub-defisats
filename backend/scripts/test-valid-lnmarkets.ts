#!/usr/bin/env tsx

/**
 * Script para testar LN Markets com credenciais válidas
 * Este script usa credenciais hardcoded para testar a integração
 */

import crypto from 'crypto';
import axios from 'axios';

// Credenciais válidas da LN Markets
const VALID_CREDENTIALS = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor'
};

// Configuração da LN Markets API
const LN_MARKETS_CONFIG = {
  BASE_URL: 'https://api.lnmarkets.com',
  ENDPOINTS: {
    FUTURES: '/v2/futures',
    POSITIONS: '/v2/positions', 
    USER: '/v2/user',
    TICKER: '/v2/ticker'
  }
};

class LNMarketsTester {
  private credentials: typeof VALID_CREDENTIALS;

  constructor(credentials: typeof VALID_CREDENTIALS) {
    this.credentials = credentials;
  }

  /**
   * Gera assinatura HMAC SHA256 para autenticação LN Markets
   */
  generateSignature(method: string, path: string, timestamp: string, body: string = ''): string {
    // String de mensagem para assinatura
    const message = method + '/v2' + path + timestamp + body;
    console.log(`📝 String de assinatura: ${message}`);
    
    // Gerar assinatura HMAC SHA256
    const signature = crypto
      .createHmac('sha256', this.credentials.secret)
      .update(message)
      .digest('base64');
    
    console.log(`🔐 Assinatura gerada: ${signature}`);
    return signature;
  }

  /**
   * Gera headers de autenticação para LN Markets
   */
  generateAuthHeaders(method: string, path: string, body: string = ''): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(method, path, timestamp, body);

    const headers = {
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    console.log(`📋 Headers gerados:`, headers);
    return headers;
  }

  /**
   * Testa endpoint específico
   */
  async testEndpoint(endpoint: string, method: string = 'GET'): Promise<void> {
    try {
      console.log(`\n🚀 Testando endpoint ${endpoint}...`);
      
      const url = `${LN_MARKETS_CONFIG.BASE_URL}${endpoint}`;
      const headers = this.generateAuthHeaders(method, endpoint.replace('/v2', ''));
      
      console.log(`🌐 URL: ${url}`);

      const response = await axios({
        method: method.toLowerCase() as any,
        url,
        headers,
        timeout: 10000
      });

      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Dados recebidos:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.error(`❌ Erro no teste de ${endpoint}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
    }
  }

  /**
   * Executa todos os testes
   */
  async runTests(): Promise<void> {
    console.log(`\n🔬 TESTANDO LN MARKETS COM CREDENCIAIS VÁLIDAS`);
    console.log(`===============================================`);
    
    // Testar endpoints principais
    await this.testEndpoint('/v2/futures');
    await this.testEndpoint('/v2/positions');
    await this.testEndpoint('/v2/user');
    await this.testEndpoint('/v2/ticker');

    console.log(`\n✅ TESTES CONCLUÍDOS`);
    console.log(`===================`);
  }
}

// Executar testes
async function main() {
  // IMPORTANTE: Substituir por credenciais válidas reais
  if (VALID_CREDENTIALS.apiKey === 'your_valid_api_key_here') {
    console.log('❌ ERRO: Credenciais não configuradas!');
    console.log('📝 Edite o arquivo e substitua as credenciais válidas');
    return;
  }

  const tester = new LNMarketsTester(VALID_CREDENTIALS);
  await tester.runTests();
}

main().catch(console.error);
