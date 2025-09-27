#!/usr/bin/env tsx

/**
 * Teste de Validade das Credenciais LN Markets
 * 
 * Verificando se as credenciais estão corretas
 */

import axios from 'axios';

// Credenciais atuais
const CURRENT_CREDENTIALS = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor'
};

class CredentialsValidator {
  private credentials: typeof CURRENT_CREDENTIALS;

  constructor(credentials: typeof CURRENT_CREDENTIALS) {
    this.credentials = credentials;
  }

  /**
   * Testa se as credenciais estão no formato correto
   */
  validateCredentialsFormat(): void {
    console.log(`\n🔍 VALIDANDO FORMATO DAS CREDENCIAIS...`);
    
    // Validar API Key
    console.log(`\n📋 API Key:`);
    console.log(`   Valor: ${this.credentials.apiKey}`);
    console.log(`   Tamanho: ${this.credentials.apiKey.length}`);
    console.log(`   É Base64 válido: ${this.isValidBase64(this.credentials.apiKey)}`);
    
    // Validar Secret
    console.log(`\n📋 Secret:`);
    console.log(`   Valor: ${this.credentials.secret}`);
    console.log(`   Tamanho: ${this.credentials.secret.length}`);
    console.log(`   É Base64 válido: ${this.isValidBase64(this.credentials.secret)}`);
    
    // Validar Passphrase
    console.log(`\n📋 Passphrase:`);
    console.log(`   Valor: ${this.credentials.passphrase}`);
    console.log(`   Tamanho: ${this.credentials.passphrase.length}`);
    console.log(`   Contém caracteres especiais: ${/[!@#$%^&*(),.?":{}|<>]/.test(this.credentials.passphrase)}`);
  }

  /**
   * Testa diferentes combinações de credenciais
   */
  async testDifferentCredentialCombinations(): Promise<void> {
    console.log(`\n🧪 TESTANDO DIFERENTES COMBINAÇÕES DE CREDENCIAIS...`);
    
    // Teste 1: Credenciais atuais
    await this.testCredentialSet('Credenciais Atuais', this.credentials);
    
    // Teste 2: API Key decodificada
    try {
      const decodedApiKey = Buffer.from(this.credentials.apiKey, 'base64').toString('utf8');
      await this.testCredentialSet('API Key Decodificada', {
        apiKey: decodedApiKey,
        secret: this.credentials.secret,
        passphrase: this.credentials.passphrase
      });
    } catch (error) {
      console.log(`❌ API Key Decodificada - Erro:`, error);
    }
    
    // Teste 3: Secret decodificado
    try {
      const decodedSecret = Buffer.from(this.credentials.secret, 'base64').toString('utf8');
      await this.testCredentialSet('Secret Decodificado', {
        apiKey: this.credentials.apiKey,
        secret: decodedSecret,
        passphrase: this.credentials.passphrase
      });
    } catch (error) {
      console.log(`❌ Secret Decodificado - Erro:`, error);
    }
    
    // Teste 4: Ambos decodificados
    try {
      const decodedApiKey = Buffer.from(this.credentials.apiKey, 'base64').toString('utf8');
      const decodedSecret = Buffer.from(this.credentials.secret, 'base64').toString('utf8');
      await this.testCredentialSet('Ambos Decodificados', {
        apiKey: decodedApiKey,
        secret: decodedSecret,
        passphrase: this.credentials.passphrase
      });
    } catch (error) {
      console.log(`❌ Ambos Decodificados - Erro:`, error);
    }
  }

  /**
   * Testa se as credenciais funcionam com endpoints públicos
   */
  async testPublicEndpoints(): Promise<void> {
    console.log(`\n🌐 TESTANDO ENDPOINTS PÚBLICOS...`);
    
    try {
      // Teste 1: Endpoint público sem autenticação
      console.log(`\n🧪 TESTANDO Endpoint Público...`);
      const response = await axios.get('https://api.lnmarkets.com/v2/ticker', {
        timeout: 10000
      });
      console.log(`✅ Endpoint Público - SUCESSO! Status: ${response.status}`);
      console.log(`📊 Dados:`, JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.log(`❌ Endpoint Público - Falhou:`, error.message);
    }
  }

  /**
   * Testa se as credenciais funcionam com autenticação simples
   */
  async testSimpleAuthentication(): Promise<void> {
    console.log(`\n🔐 TESTANDO AUTENTICAÇÃO SIMPLES...`);
    
    try {
      // Teste 1: Apenas API Key
      console.log(`\n🧪 TESTANDO Apenas API Key...`);
      const response1 = await axios.get('https://api.lnmarkets.com/v2/futures?type=running', {
        headers: {
          'LNM-ACCESS-KEY': this.credentials.apiKey
        },
        timeout: 10000
      });
      console.log(`✅ Apenas API Key - SUCESSO! Status: ${response1.status}`);
    } catch (error: any) {
      console.log(`❌ Apenas API Key - Falhou:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    try {
      // Teste 2: API Key + Passphrase
      console.log(`\n🧪 TESTANDO API Key + Passphrase...`);
      const response2 = await axios.get('https://api.lnmarkets.com/v2/futures?type=running', {
        headers: {
          'LNM-ACCESS-KEY': this.credentials.apiKey,
          'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase
        },
        timeout: 10000
      });
      console.log(`✅ API Key + Passphrase - SUCESSO! Status: ${response2.status}`);
    } catch (error: any) {
      console.log(`❌ API Key + Passphrase - Falhou:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
  }

  /**
   * Testa um conjunto específico de credenciais
   */
  async testCredentialSet(testName: string, credentials: any): Promise<void> {
    try {
      console.log(`\n🧪 TESTANDO ${testName}...`);
      console.log(`   API Key: ${credentials.apiKey.substring(0, 20)}...`);
      console.log(`   Secret: ${credentials.secret.substring(0, 20)}...`);
      console.log(`   Passphrase: ${credentials.passphrase}`);
      
      const response = await axios.get('https://api.lnmarkets.com/v2/futures?type=running', {
        headers: {
          'LNM-ACCESS-KEY': credentials.apiKey,
          'LNM-ACCESS-SIGNATURE': 'test-signature',
          'LNM-ACCESS-PASSPHRASE': credentials.passphrase,
          'LNM-ACCESS-TIMESTAMP': Date.now().toString()
        },
        timeout: 10000
      });
      
      console.log(`✅ ${testName} - SUCESSO! Status: ${response.status}`);
    } catch (error: any) {
      console.log(`❌ ${testName} - Falhou:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
  }

  /**
   * Verifica se uma string é Base64 válido
   */
  isValidBase64(str: string): boolean {
    try {
      return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (error) {
      return false;
    }
  }

  /**
   * Executa todos os testes
   */
  async runAllTests(): Promise<void> {
    console.log(`\n🔍 VALIDAÇÃO COMPLETA DAS CREDENCIAIS`);
    console.log(`=====================================`);
    
    this.validateCredentialsFormat();
    await this.testPublicEndpoints();
    await this.testSimpleAuthentication();
    await this.testDifferentCredentialCombinations();

    console.log(`\n✅ TODOS OS TESTES CONCLUÍDOS`);
    console.log(`=============================`);
  }
}

// Executar todos os testes
async function main() {
  const validator = new CredentialsValidator(CURRENT_CREDENTIALS);
  await validator.runAllTests();
}

main().catch(console.error);
