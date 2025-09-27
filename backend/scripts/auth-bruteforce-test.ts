#!/usr/bin/env tsx

/**
 * TESTE DE GUERRILHA - AUTENTICAÇÃO LN MARKETS
 * 
 * Testa TODAS as combinações possíveis de:
 * - Ordem da string de assinatura
 * - Codificação HMAC SHA256
 * 
 * Objetivo: Identificar a ÚNICA combinação que resulta em 200 OK
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';

// Configuração do banco
const prisma = new PrismaClient();

// Credenciais válidas para teste direto (fallback)
const FALLBACK_CREDENTIALS = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor'
};

class AuthBruteforceTester {
  private credentials: typeof FALLBACK_CREDENTIALS;
  private testEndpoint = 'https://api.lnmarkets.com/v2/futures?type=running';
  private testMethod = 'GET';
  private testPath = '/v2/futures?type=running';

  constructor(credentials: typeof FALLBACK_CREDENTIALS) {
    this.credentials = credentials;
  }

  /**
   * Carrega credenciais do banco de dados
   */
  async loadCredentialsFromDatabase(): Promise<boolean> {
    try {
      console.log('🔍 CARREGANDO CREDENCIAIS DO BANCO...');
      
      const user = await prisma.user.findFirst({
        where: {
          email: 'brainoschris@gmail.com'
        },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true
        }
      });

      if (!user?.ln_markets_api_key || !user?.ln_markets_api_secret || !user?.ln_markets_passphrase) {
        console.log('❌ CREDENCIAIS NÃO ENCONTRADAS NO BANCO, USANDO FALLBACK');
        return false;
      }

      // Descriptografar credenciais
      const { AuthService } = await import('../src/services/auth.service');
      const authService = new AuthService(prisma, {} as any);
      
      this.credentials = {
        apiKey: authService.decryptData(user.ln_markets_api_key),
        secret: authService.decryptData(user.ln_markets_api_secret),
        passphrase: authService.decryptData(user.ln_markets_passphrase)
      };

      console.log('✅ CREDENCIAIS CARREGADAS DO BANCO COM SUCESSO');
      return true;
    } catch (error: any) {
      console.log('❌ ERRO AO CARREGAR CREDENCIAIS DO BANCO:', error.message);
      return false;
    }
  }

  /**
   * Define todas as possíveis ordens da string de assinatura
   */
  getSignatureOrders(): Array<{
    name: string;
    buildMessage: (timestamp: string, method: string, path: string, params: string) => string;
  }> {
    return [
      {
        name: 'timestamp + method + path + params',
        buildMessage: (t, m, p, params) => `${t}${m}${p}${params}`
      },
      {
        name: 'method + path + timestamp + params',
        buildMessage: (t, m, p, params) => `${m}${p}${t}${params}`
      },
      {
        name: 'method + /v2 + path + timestamp + params',
        buildMessage: (t, m, p, params) => `${m}/v2${p}${t}${params}`
      },
      {
        name: 'timestamp + method + /v2 + path + params',
        buildMessage: (t, m, p, params) => `${t}${m}/v2${p}${params}`
      },
      {
        name: 'method + path + params + timestamp',
        buildMessage: (t, m, p, params) => `${m}${p}${params}${t}`
      },
      {
        name: 'timestamp + method + path (sem params)',
        buildMessage: (t, m, p, params) => `${t}${m}${p}`
      },
      {
        name: 'method + path + timestamp (sem params)',
        buildMessage: (t, m, p, params) => `${m}${p}${t}`
      },
      {
        name: 'timestamp + method + /v2 + path (sem params)',
        buildMessage: (t, m, p, params) => `${t}${m}/v2${p}`
      },
      {
        name: 'method + /v2 + path + timestamp (sem params)',
        buildMessage: (t, m, p, params) => `${m}/v2${p}${t}`
      },
      {
        name: 'timestamp + method + path + params + \\n',
        buildMessage: (t, m, p, params) => `${t}${m}${p}${params}\n`
      },
      {
        name: 'method + path + timestamp + params + \\n',
        buildMessage: (t, m, p, params) => `${m}${p}${t}${params}\n`
      },
      {
        name: 'timestamp + method + path + \\n + params',
        buildMessage: (t, m, p, params) => `${t}${m}${p}\n${params}`
      },
      {
        name: 'method + \\n + path + timestamp + params',
        buildMessage: (t, m, p, params) => `${m}\n${p}${t}${params}`
      },
      {
        name: 'timestamp + \\n + method + path + params',
        buildMessage: (t, m, p, params) => `${t}\n${m}${p}${params}`
      },
      {
        name: 'method + path + \\n + timestamp + params',
        buildMessage: (t, m, p, params) => `${m}${p}\n${t}${params}`
      }
    ];
  }

  /**
   * Define todas as possíveis codificações HMAC
   */
  getHmacEncodings(): Array<{
    name: string;
    digest: (hmac: crypto.Hmac) => string;
  }> {
    return [
      {
        name: 'base64',
        digest: (hmac) => hmac.digest('base64')
      },
      {
        name: 'hex',
        digest: (hmac) => hmac.digest('hex')
      },
      {
        name: 'base64url',
        digest: (hmac) => hmac.digest('base64url')
      },
      {
        name: 'latin1',
        digest: (hmac) => hmac.digest('latin1')
      }
    ];
  }

  /**
   * Testa uma combinação específica
   */
  async testCombination(
    orderName: string,
    encodingName: string,
    orderBuilder: (t: string, m: string, p: string, params: string) => string,
    encodingDigest: (hmac: crypto.Hmac) => string
  ): Promise<{
    success: boolean;
    status?: number;
    message?: string;
    response?: any;
  }> {
    try {
      const timestamp = Date.now().toString();
      const method = this.testMethod;
      const path = this.testPath;
      const params = 'type=running'; // Parâmetros da query string

      // Construir mensagem usando a ordem específica
      const message = orderBuilder(timestamp, method, path, params);
      
      console.log(`\n🧪 TESTANDO: ${orderName} + ${encodingName}`);
      console.log(`📝 Mensagem: "${message}"`);

      // Gerar assinatura usando a codificação específica
      const hmac = crypto.createHmac('sha256', this.credentials.secret);
      hmac.update(message, 'utf8');
      const signature = encodingDigest(hmac);

      console.log(`🔐 Assinatura: ${signature.substring(0, 20)}...`);

      // Fazer requisição para LN Markets
      const response = await axios.get(this.testEndpoint, {
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

      return {
        success: true,
        status: response.status,
        message: 'SUCCESS',
        response: response.data
      };

    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      
      console.log(`❌ FALHOU! Status: ${status}, Mensagem: ${message}`);

      return {
        success: false,
        status,
        message
      };
    }
  }

  /**
   * Executa o teste de guerrilha completo
   */
  async runBruteforceTest(): Promise<void> {
    console.log('🚀 INICIANDO TESTE DE GUERRILHA - AUTENTICAÇÃO LN MARKETS');
    console.log('================================================================');
    
    // Carregar credenciais
    const credentialsLoaded = await this.loadCredentialsFromDatabase();
    if (!credentialsLoaded) {
      console.log('⚠️ USANDO CREDENCIAIS FALLBACK');
    }

    console.log(`\n🔑 CREDENCIAIS DE TESTE:`);
    console.log(`   API Key: ${this.credentials.apiKey.substring(0, 20)}...`);
    console.log(`   Secret: ${this.credentials.secret.substring(0, 20)}...`);
    console.log(`   Passphrase: ${this.credentials.passphrase}`);

    const orders = this.getSignatureOrders();
    const encodings = this.getHmacEncodings();
    
    console.log(`\n📊 COMBINAÇÕES A TESTAR: ${orders.length} ordens × ${encodings.length} codificações = ${orders.length * encodings.length} total`);

    let winnerFound = false;
    let testCount = 0;
    const totalTests = orders.length * encodings.length;

    for (const order of orders) {
      if (winnerFound) break;
      
      for (const encoding of encodings) {
        testCount++;
        console.log(`\n🔄 TESTE ${testCount}/${totalTests}`);
        
        const result = await this.testCombination(
          order.name,
          encoding.name,
          order.buildMessage,
          encoding.digest
        );

        if (result.success) {
          console.log('\n🎉🎉🎉 COMBINAÇÃO VENCEDORA ENCONTRADA! 🎉🎉🎉');
          console.log('================================================================');
          console.log(`✅ ORDEM: ${order.name}`);
          console.log(`✅ CODIFICAÇÃO: ${encoding.name}`);
          console.log(`✅ STATUS: ${result.status}`);
          console.log(`✅ MENSAGEM: ${result.message}`);
          console.log('================================================================');
          
          // Salvar combinação vencedora
          await this.saveWinningCombination(order.name, encoding.name, result);
          
          winnerFound = true;
          break;
        }

        // Pequena pausa entre testes para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (!winnerFound) {
      console.log('\n❌❌❌ NENHUMA COMBINAÇÃO FUNCIONOU! ❌❌❌');
      console.log('================================================================');
      console.log('Todas as combinações testadas falharam.');
      console.log('Possíveis causas:');
      console.log('- Credenciais inválidas');
      console.log('- API da LN Markets offline');
      console.log('- Formato de autenticação mudou');
      console.log('- Endpoint de teste incorreto');
      console.log('================================================================');
    }

    console.log('\n✅ TESTE DE GUERRILHA CONCLUÍDO');
  }

  /**
   * Salva a combinação vencedora em arquivo
   */
  async saveWinningCombination(order: string, encoding: string, result: any): Promise<void> {
    const winningData = {
      timestamp: new Date().toISOString(),
      order,
      encoding,
      status: result.status,
      message: result.message,
      credentials: {
        apiKey: this.credentials.apiKey.substring(0, 20) + '...',
        secret: this.credentials.secret.substring(0, 20) + '...',
        passphrase: this.credentials.passphrase
      },
      testEndpoint: this.testEndpoint,
      testMethod: this.testMethod,
      testPath: this.testPath
    };

    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.join(__dirname, 'winning-auth-combination.json');
    fs.writeFileSync(filePath, JSON.stringify(winningData, null, 2));
    
    console.log(`💾 COMBINAÇÃO VENCEDORA SALVA EM: ${filePath}`);
  }
}

// Executar teste
async function main() {
  const tester = new AuthBruteforceTester(FALLBACK_CREDENTIALS);
  await tester.runBruteforceTest();
  await prisma.$disconnect();
}

main().catch(console.error);
