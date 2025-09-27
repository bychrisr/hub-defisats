#!/usr/bin/env tsx

/**
 * Teste Final - LN Markets com Lógica de Autenticação Correta
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

class LNMarketsFinalTester {
  private credentials: typeof VALID_CREDENTIALS;

  constructor(credentials: typeof VALID_CREDENTIALS) {
    this.credentials = credentials;
  }

  /**
   * Gera assinatura FINAL correta para LN Markets
   * Baseado na documentação oficial: method + path + timestamp + body
   */
  generateFinalSignature(method: string, path: string, timestamp: string, body: string = ''): string {
    // String de mensagem FINAL correta: method + path + timestamp + body
    const message = method + path + timestamp + body;
    console.log(`📝 String de assinatura FINAL: ${message}`);
    
    // Gerar assinatura HMAC SHA256
    const signature = crypto
      .createHmac('sha256', this.credentials.secret)
      .update(message)
      .digest('base64');
    
    console.log(`🔐 Assinatura FINAL gerada: ${signature}`);
    return signature;
  }

  /**
   * Gera headers FINAIS corretos para LN Markets
   * Timestamp em MILISSEGUNDOS conforme documentação
   */
  generateFinalHeaders(method: string, path: string, body: string = ''): Record<string, string> {
    // Timestamp em MILISSEGUNDOS conforme documentação oficial
    const timestamp = Date.now().toString();
    const signature = this.generateFinalSignature(method, path, timestamp, body);

    const headers = {
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    console.log(`📋 Headers FINAIS:`, headers);
    return headers;
  }

  /**
   * Testa endpoint específico com lógica FINAL
   */
  async testFinalEndpoint(endpoint: string, method: string = 'GET'): Promise<void> {
    try {
      console.log(`\n🚀 TESTE FINAL - ${endpoint}...`);
      
      const url = `https://api.lnmarkets.com${endpoint}`;
      const headers = this.generateFinalHeaders(method, endpoint);
      
      console.log(`🌐 URL: ${url}`);

      const response = await axios({
        method: method.toLowerCase() as any,
        url,
        headers,
        timeout: 10000
      });

      console.log(`✅ SUCESSO! Status: ${response.status}`);
      console.log(`📊 Dados recebidos:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.error(`❌ Erro no teste FINAL de ${endpoint}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
  }

  /**
   * Executa testes FINAIS com endpoints corretos
   */
  async runFinalTests(): Promise<void> {
    console.log(`\n🔬 TESTE FINAL - LN MARKETS COM LÓGICA CORRETA`);
    console.log(`===============================================`);
    
    // Testar endpoints que sabemos que existem conforme documentação oficial
    await this.testFinalEndpoint('/v2/futures?type=running');
    await this.testFinalEndpoint('/v2/user');
    await this.testFinalEndpoint('/v2/futures/btc_usd/ticker');

    console.log(`\n✅ TESTES FINAIS CONCLUÍDOS`);
    console.log(`===========================`);
  }
}

// Executar testes finais
async function main() {
  const tester = new LNMarketsFinalTester(VALID_CREDENTIALS);
  await tester.runFinalTests();
}

main().catch(console.error);
