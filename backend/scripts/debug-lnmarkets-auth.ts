#!/usr/bin/env tsx

/**
 * Script de Diagnóstico - Autenticação LN Markets
 * 
 * Este script isola a lógica de autenticação da LN Markets para diagnosticar
 * problemas de integração com a API real.
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';

// Configuração da LN Markets API
const LN_MARKETS_CONFIG = {
  BASE_URL: 'https://api.lnmarkets.com',
  TESTNET_URL: 'https://api.testnet4.lnmarkets.com',
  ENDPOINTS: {
    FUTURES: '/v2/futures',
    POSITIONS: '/v2/positions',
    USER: '/v2/user',
    TICKER: '/v2/ticker'
  }
};

interface LNMarketsCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

interface LNMarketsUser {
  id: string;
  email: string;
  encryptedCredentials: string;
}

class LNMarketsAuthTester {
  private prisma: PrismaClient;
  private credentials: LNMarketsCredentials | null = null;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Busca credenciais do usuário no banco de dados
   */
  async fetchUserCredentials(email: string): Promise<LNMarketsUser | null> {
    try {
      console.log(`🔍 Buscando credenciais para: ${email}`);
      
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true
        }
      });

      if (!user) {
        console.error(`❌ Usuário não encontrado: ${email}`);
        return null;
      }

      if (!user.ln_markets_api_key || !user.ln_markets_api_secret || !user.ln_markets_passphrase) {
        console.error(`❌ Credenciais LN Markets não encontradas para: ${email}`);
        return null;
      }

      console.log(`✅ Usuário encontrado: ${user.id}`);
      console.log(`🔑 API Key: ${user.ln_markets_api_key.substring(0, 8)}...`);
      console.log(`🔐 Secret: ${user.ln_markets_api_secret.substring(0, 8)}...`);
      console.log(`🔑 Passphrase: ${user.ln_markets_passphrase.substring(0, 4)}...`);

      return {
        id: user.id,
        email: user.email,
        encryptedCredentials: JSON.stringify({
          apiKey: user.ln_markets_api_key,
          secret: user.ln_markets_api_secret,
          passphrase: user.ln_markets_passphrase
        })
      };
    } catch (error) {
      console.error('❌ Erro ao buscar credenciais:', error);
      return null;
    }
  }

  /**
   * Descriptografa credenciais (simulando lógica do AuthService)
   */
  decryptCredentials(encryptedCredentials: string): LNMarketsCredentials | null {
    try {
      // Simular descriptografia (usar mesma lógica do AuthService)
      const credentials = JSON.parse(encryptedCredentials);
      
      this.credentials = {
        apiKey: credentials.apiKey,
        secret: credentials.secret,
        passphrase: credentials.passphrase
      };

      console.log(`✅ Credenciais descriptografadas com sucesso`);
      return this.credentials;
    } catch (error) {
      console.error('❌ Erro ao descriptografar credenciais:', error);
      return null;
    }
  }

  /**
   * Gera assinatura HMAC SHA256 para autenticação LN Markets
   */
  generateSignature(method: string, path: string, timestamp: string, body: string = ''): string {
    if (!this.credentials) {
      throw new Error('Credenciais não carregadas');
    }

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
    if (!this.credentials) {
      throw new Error('Credenciais não carregadas');
    }

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
   * Testa conexão com endpoint de futures
   */
  async testFuturesEndpoint(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Credenciais não carregadas');
    }

    try {
      console.log(`\n🚀 Testando endpoint /v2/futures...`);
      
      const url = `${LN_MARKETS_CONFIG.BASE_URL}${LN_MARKETS_CONFIG.ENDPOINTS.FUTURES}`;
      const headers = this.generateAuthHeaders('GET', '/futures');
      
      console.log(`🌐 URL: ${url}`);
      console.log(`📤 Headers:`, JSON.stringify(headers, null, 2));

      const response = await axios.get(url, { 
        headers,
        timeout: 10000
      });

      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Dados recebidos:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.error(`❌ Erro no teste de futures:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
    }
  }

  /**
   * Testa conexão com endpoint de posições
   */
  async testPositionsEndpoint(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Credenciais não carregadas');
    }

    try {
      console.log(`\n🚀 Testando endpoint /v2/positions...`);
      
      const url = `${LN_MARKETS_CONFIG.BASE_URL}${LN_MARKETS_CONFIG.ENDPOINTS.POSITIONS}`;
      const headers = this.generateAuthHeaders('GET', '/positions');
      
      console.log(`🌐 URL: ${url}`);
      console.log(`📤 Headers:`, JSON.stringify(headers, null, 2));

      const response = await axios.get(url, { 
        headers,
        timeout: 10000
      });

      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Dados recebidos:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.error(`❌ Erro no teste de posições:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
    }
  }

  /**
   * Testa conexão com endpoint de usuário
   */
  async testUserEndpoint(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Credenciais não carregadas');
    }

    try {
      console.log(`\n🚀 Testando endpoint /v2/user...`);
      
      const url = `${LN_MARKETS_CONFIG.BASE_URL}${LN_MARKETS_CONFIG.ENDPOINTS.USER}`;
      const headers = this.generateAuthHeaders('GET', '/user');
      
      console.log(`🌐 URL: ${url}`);
      console.log(`📤 Headers:`, JSON.stringify(headers, null, 2));

      const response = await axios.get(url, { 
        headers,
        timeout: 10000
      });

      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Dados recebidos:`, JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.error(`❌ Erro no teste de usuário:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
    }
  }

  /**
   * Executa todos os testes de diagnóstico
   */
  async runDiagnostics(email: string): Promise<void> {
    console.log(`\n🔬 INICIANDO DIAGNÓSTICO LN MARKETS`);
    console.log(`=====================================`);
    
    try {
      // 1. Buscar credenciais
      const user = await this.fetchUserCredentials(email);
      if (!user) {
        console.error(`❌ Falha ao obter credenciais para ${email}`);
        return;
      }

      // 2. Descriptografar credenciais
      const credentials = this.decryptCredentials(user.encryptedCredentials);
      if (!credentials) {
        console.error(`❌ Falha ao descriptografar credenciais`);
        return;
      }

      // 3. Testar endpoints
      await this.testFuturesEndpoint();
      await this.testPositionsEndpoint();
      await this.testUserEndpoint();

      console.log(`\n✅ DIAGNÓSTICO CONCLUÍDO`);
      console.log(`========================`);

    } catch (error) {
      console.error(`❌ Erro durante diagnóstico:`, error);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Executar diagnóstico
async function main() {
  const tester = new LNMarketsAuthTester();
  await tester.runDiagnostics('brainoschris@gmail.com');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { LNMarketsAuthTester };
