#!/usr/bin/env tsx

/**
 * Análise da Diferença entre API Pública e Autenticada
 * 
 * Endpoint público funciona: /v2/futures/ticker
 * Endpoint autenticado falha: /v2/futures?type=running
 */

import crypto from 'crypto';
import axios from 'axios';

// Credenciais válidas da LN Markets
const VALID_CREDENTIALS = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor'
};

class AuthDifferenceAnalyzer {
  private credentials: typeof VALID_CREDENTIALS;

  constructor(credentials: typeof VALID_CREDENTIALS) {
    this.credentials = credentials;
  }

  /**
   * Testa endpoint público (que sabemos que funciona)
   */
  async testPublicEndpoint(): Promise<void> {
    try {
      console.log(`\n🌐 TESTANDO ENDPOINT PÚBLICO (que funciona)...`);
      
      const response = await axios.get('https://api.lnmarkets.com/v2/futures/ticker', {
        timeout: 10000
      });

      console.log(`✅ PÚBLICO - Status: ${response.status}`);
      console.log(`📊 PÚBLICO - Dados:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.error(`❌ PÚBLICO - Erro:`, error.message);
    }
  }

  /**
   * Testa diferentes formatos de string de assinatura
   */
  async testDifferentSignatureFormats(): Promise<void> {
    console.log(`\n🔐 TESTANDO DIFERENTES FORMATOS DE ASSINATURA...`);
    
    const method = 'GET';
    const path = '/v2/futures?type=running';
    const timestamp = Date.now().toString();
    const body = '';

    // Formato 1: method + path + timestamp + body (atual)
    const format1 = method + path + timestamp + body;
    const signature1 = crypto.createHmac('sha256', this.credentials.secret).update(format1).digest('base64');
    console.log(`📝 Formato 1: ${format1}`);
    console.log(`🔐 Assinatura 1: ${signature1}`);

    // Formato 2: method + '/v2' + path + timestamp + body (com /v2)
    const format2 = method + '/v2' + path + timestamp + body;
    const signature2 = crypto.createHmac('sha256', this.credentials.secret).update(format2).digest('base64');
    console.log(`📝 Formato 2: ${format2}`);
    console.log(`🔐 Assinatura 2: ${signature2}`);

    // Formato 3: path + timestamp + body (sem method)
    const format3 = path + timestamp + body;
    const signature3 = crypto.createHmac('sha256', this.credentials.secret).update(format3).digest('base64');
    console.log(`📝 Formato 3: ${format3}`);
    console.log(`🔐 Assinatura 3: ${signature3}`);

    // Formato 4: timestamp + method + path + body
    const format4 = timestamp + method + path + body;
    const signature4 = crypto.createHmac('sha256', this.credentials.secret).update(format4).digest('base64');
    console.log(`📝 Formato 4: ${format4}`);
    console.log(`🔐 Assinatura 4: ${signature4}`);

    // Testar cada formato
    await this.testSignatureFormat('Formato 1', signature1, timestamp);
    await this.testSignatureFormat('Formato 2', signature2, timestamp);
    await this.testSignatureFormat('Formato 3', signature3, timestamp);
    await this.testSignatureFormat('Formato 4', signature4, timestamp);
  }

  /**
   * Testa um formato específico de assinatura
   */
  async testSignatureFormat(formatName: string, signature: string, timestamp: string): Promise<void> {
    try {
      console.log(`\n🧪 TESTANDO ${formatName}...`);
      
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
   * Executa análise completa
   */
  async runAnalysis(): Promise<void> {
    console.log(`\n🔬 ANÁLISE DE DIFERENÇA - API PÚBLICA vs AUTENTICADA`);
    console.log(`====================================================`);
    
    await this.testPublicEndpoint();
    await this.testDifferentSignatureFormats();

    console.log(`\n✅ ANÁLISE CONCLUÍDA`);
    console.log(`===================`);
  }
}

// Executar análise
async function main() {
  const analyzer = new AuthDifferenceAnalyzer(VALID_CREDENTIALS);
  await analyzer.runAnalysis();
}

main().catch(console.error);
