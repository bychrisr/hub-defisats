#!/usr/bin/env tsx

/**
 * TESTE DE CONECTIVIDADE LN MARKETS
 * 
 * Verifica se a API da LN Markets está online e acessível
 */

import axios from 'axios';

class LNMarketsConnectivityTester {
  private baseURL = 'https://api.lnmarkets.com';

  /**
   * Testa endpoints públicos (sem autenticação)
   */
  async testPublicEndpoints(): Promise<void> {
    console.log('🌐 TESTANDO CONECTIVIDADE LN MARKETS');
    console.log('=====================================');

    const publicEndpoints = [
      '/v2/ticker',
      '/v2/futures',
      '/v2/options',
      '/v2/user',
      '/v2/futures?type=running',
      '/v2/futures?type=closed',
      '/v2/futures?type=all'
    ];

    for (const endpoint of publicEndpoints) {
      try {
        console.log(`\n🧪 TESTANDO: ${endpoint}`);
        const response = await axios.get(`${this.baseURL}${endpoint}`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Hub-DefiSats-Connectivity-Test/1.0'
          }
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
   * Testa diferentes domínios da LN Markets
   */
  async testDifferentDomains(): Promise<void> {
    console.log('\n🌐 TESTANDO DIFERENTES DOMÍNIOS');
    console.log('=================================');

    const domains = [
      'https://api.lnmarkets.com',
      'https://api.lnmarkets.com/v2',
      'https://lnmarkets.com/api',
      'https://lnmarkets.com/api/v2',
      'https://api.lnmarkets.io',
      'https://api.lnmarkets.io/v2'
    ];

    for (const domain of domains) {
      try {
        console.log(`\n🧪 TESTANDO: ${domain}`);
        const response = await axios.get(`${domain}/v2/ticker`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Hub-DefiSats-Connectivity-Test/1.0'
          }
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
   * Testa com diferentes User-Agents
   */
  async testDifferentUserAgents(): Promise<void> {
    console.log('\n🌐 TESTANDO DIFERENTES USER-AGENTS');
    console.log('===================================');

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'curl/7.68.0',
      'PostmanRuntime/7.28.4',
      'Hub-DefiSats/1.0',
      'LN-Markets-Client/1.0'
    ];

    for (const userAgent of userAgents) {
      try {
        console.log(`\n🧪 TESTANDO User-Agent: ${userAgent.substring(0, 30)}...`);
        const response = await axios.get(`${this.baseURL}/v2/ticker`, {
          timeout: 10000,
          headers: {
            'User-Agent': userAgent
          }
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
    await this.testPublicEndpoints();
    await this.testDifferentDomains();
    await this.testDifferentUserAgents();
    
    console.log('\n✅ TESTE DE CONECTIVIDADE CONCLUÍDO');
  }
}

// Executar testes
async function main() {
  const tester = new LNMarketsConnectivityTester();
  await tester.runAllTests();
}

main().catch(console.error);
