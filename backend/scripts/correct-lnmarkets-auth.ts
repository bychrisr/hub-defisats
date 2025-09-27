#!/usr/bin/env tsx

/**
 * Script para testar e corrigir autenticação LN Markets
 * Baseado na documentação oficial da LN Markets
 */

import crypto from 'crypto';
import axios from 'axios';

// Credenciais válidas da LN Markets
const VALID_CREDENTIALS = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor'
};

class LNMarketsAuthCorrector {
  private credentials: typeof VALID_CREDENTIALS;

  constructor(credentials: typeof VALID_CREDENTIALS) {
    this.credentials = credentials;
  }

  /**
   * Gera assinatura correta para LN Markets
   * Baseado na documentação oficial: method + path + timestamp + body
   */
  generateCorrectSignature(method: string, path: string, timestamp: string, body: string = ''): string {
    // String de mensagem correta: method + path + timestamp + body
    const message = method + path + timestamp + body;
    console.log(`📝 String de assinatura CORRETA: ${message}`);
    
    // Gerar assinatura HMAC SHA256
    const signature = crypto
      .createHmac('sha256', this.credentials.secret)
      .update(message)
      .digest('base64');
    
    console.log(`🔐 Assinatura gerada: ${signature}`);
    return signature;
  }

  /**
   * Gera headers corretos para LN Markets
   * Timestamp deve ser em MILISSEGUNDOS conforme documentação
   */
  generateCorrectHeaders(method: string, path: string, body: string = ''): Record<string, string> {
    // Timestamp em MILISSEGUNDOS conforme documentação oficial
    const timestamp = Date.now().toString();
    const signature = this.generateCorrectSignature(method, path, timestamp, body);

    const headers = {
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    console.log(`📋 Headers corretos:`, headers);
    return headers;
  }

  /**
   * Testa endpoint com autenticação correta
   */
  async testEndpointCorrectly(endpoint: string, method: string = 'GET'): Promise<void> {
    try {
      console.log(`\n🚀 Testando ${endpoint} com autenticação CORRETA...`);
      
      const url = `https://api.lnmarkets.com${endpoint}`;
      const headers = this.generateCorrectHeaders(method, endpoint);
      
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
        data: error.response?.data
      });
    }
  }

  /**
   * Testa endpoints que sabemos que existem conforme documentação oficial
   */
  async testKnownEndpoints(): Promise<void> {
    console.log(`\n🔬 TESTANDO ENDPOINTS CONHECIDOS DA LN MARKETS`);
    console.log(`==============================================`);
    
    // Testar endpoints que sabemos que existem conforme documentação oficial
    await this.testEndpointCorrectly('/v2/futures?type=running');
    await this.testEndpointCorrectly('/v2/futures?type=closed');
    await this.testEndpointCorrectly('/v2/user');
    await this.testEndpointCorrectly('/v2/futures/btc_usd/ticker');
    await this.testEndpointCorrectly('/v2/futures/market');

    console.log(`\n✅ TESTES CONCLUÍDOS`);
    console.log(`===================`);
  }
}

// Executar testes
async function main() {
  const corrector = new LNMarketsAuthCorrector(VALID_CREDENTIALS);
  await corrector.testKnownEndpoints();
}

main().catch(console.error);
