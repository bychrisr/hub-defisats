#!/usr/bin/env npx tsx

/**
 * 🔥 SCRIPT DE TESTE DE AUTENTICAÇÃO BRUTEFORCE - LN MARKETS API v2
 * 
 * Este script testa TODAS as combinações possíveis de:
 * 1. Ordem da string de assinatura
 * 2. Codificação HMAC SHA256
 * 
 * Objetivo: Encontrar a combinação que resulta em 200 OK com a API da LN Markets
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import axios from 'axios';

// Configuração do banco de dados
const prisma = new PrismaClient();

// Configuração de criptografia (mesma do AuthService)
const config = {
  security: {
    encryption: {
      key: process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production'
    }
  }
};

/**
 * Descriptografa dados usando a mesma lógica do AuthService
 */
function decryptData(encryptedData: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(config.security.encryption.key, 'salt', 32);

  const parts = encryptedData.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(parts[0] as string, 'hex');
  const encrypted = parts[1] as string;

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Gera assinatura HMAC SHA256 com diferentes codificações
 */
function generateSignature(message: string, secret: string, encoding: 'base64' | 'hex'): string {
  return crypto
    .createHmac('sha256', secret)
    .update(message, 'utf8')
    .digest(encoding);
}

/**
 * Constrói mensagem de assinatura com diferentes ordens
 */
function buildMessage(
  timestamp: string,
  method: string,
  path: string,
  params: string,
  order: string
): string {
  switch (order) {
    case 'timestamp_method_path_params':
      return timestamp + method + path + params;
    case 'method_path_timestamp_params':
      return method + path + timestamp + params;
    case 'timestamp_method_v2_path_params':
      return timestamp + method + '/v2' + path + params;
    case 'method_v2_path_timestamp_params':
      return method + '/v2' + path + timestamp + params;
    case 'timestamp_method_path':
      return timestamp + method + path;
    case 'method_path_params_timestamp':
      return method + path + params + timestamp;
    case 'timestamp_method_path_params_empty':
      return timestamp + method + path + (params || '');
    case 'method_path_timestamp':
      return method + path + timestamp;
    case 'timestamp_path_method_params':
      return timestamp + path + method + params;
    case 'path_method_timestamp_params':
      return path + method + timestamp + params;
    default:
      return timestamp + method + path + params;
  }
}

/**
 * Testa uma combinação específica de ordem e codificação
 */
async function testCombination(
  apiKey: string,
  apiSecret: string,
  passphrase: string,
  order: string,
  encoding: 'base64' | 'hex',
  testEndpoint: string = '/user'
): Promise<{ success: boolean; status: number; response: any; error?: string }> {
    try {
      const timestamp = Date.now().toString();
    const method = 'GET';
    const path = testEndpoint;
    const params = ''; // GET request sem parâmetros

    // Construir mensagem de acordo com a ordem
    const message = buildMessage(timestamp, method, path, params, order);
    
    // Gerar assinatura com a codificação específica
    const signature = generateSignature(message, apiSecret, encoding);

    // Headers de autenticação
    const headers = {
      'LNM-ACCESS-KEY': apiKey,
          'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': passphrase,
          'LNM-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json'
    };

    // Fazer requisição para a API da LN Markets
    const response = await axios.get(`https://api.lnmarkets.com/v2${testEndpoint}`, {
      headers,
        timeout: 10000
      });

      return {
        success: true,
        status: response.status,
        response: response.data
      };

    } catch (error: any) {
      return {
        success: false,
      status: error.response?.status || 0,
      response: error.response?.data || null,
      error: error.message
      };
    }
  }

  /**
 * Função principal do script
 */
async function main() {
  console.log('🔥 INICIANDO TESTE DE AUTENTICAÇÃO BRUTEFORCE - LN MARKETS API v2');
  console.log('=' .repeat(80));

  try {
    // 1. Conectar ao banco de dados
    console.log('📊 Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    // 2. Buscar credenciais do usuário brainoschris@gmail.com
    console.log('🔍 Buscando credenciais do usuário brainoschris@gmail.com...');
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
      select: {
        id: true,
        email: true,
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true
      }
    });

    if (!user) {
      throw new Error('Usuário brainoschris@gmail.com não encontrado');
    }

    if (!user.ln_markets_api_key || !user.ln_markets_api_secret || !user.ln_markets_passphrase) {
      throw new Error('Credenciais LN Markets não encontradas para o usuário');
    }

    console.log('✅ Usuário encontrado:', user.email);

    // 3. Descriptografar credenciais
    console.log('🔐 Descriptografando credenciais...');
    let apiKey: string, apiSecret: string, passphrase: string;

    try {
      apiKey = decryptData(user.ln_markets_api_key);
      apiSecret = decryptData(user.ln_markets_api_secret);
      passphrase = decryptData(user.ln_markets_passphrase);
      console.log('✅ Credenciais descriptografadas com sucesso');
    } catch (error) {
      console.log('⚠️ Erro na descriptografia, usando credenciais em texto plano');
      apiKey = user.ln_markets_api_key;
      apiSecret = user.ln_markets_api_secret;
      passphrase = user.ln_markets_passphrase;
    }

    console.log('🔑 Credenciais obtidas:', {
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING',
      apiSecret: apiSecret ? `${apiSecret.substring(0, 10)}...` : 'MISSING',
      passphrase: passphrase ? `${passphrase.substring(0, 5)}...` : 'MISSING'
    });

    // 4. Definir todas as combinações possíveis
    const signatureOrders = [
      'timestamp_method_path_params',
      'method_path_timestamp_params',
      'timestamp_method_v2_path_params',
      'method_v2_path_timestamp_params',
      'timestamp_method_path',
      'method_path_params_timestamp',
      'timestamp_method_path_params_empty',
      'method_path_timestamp',
      'timestamp_path_method_params',
      'path_method_timestamp_params'
    ];

    const encodings: ('base64' | 'hex')[] = ['base64', 'hex'];

    console.log('🎯 Testando', signatureOrders.length * encodings.length, 'combinações...');
    console.log('📋 Ordens de assinatura:', signatureOrders);
    console.log('🔤 Codificações:', encodings);
    console.log('=' .repeat(80));

    // 5. Testar todas as combinações
    let successFound = false;
    const results: Array<{
      order: string;
      encoding: string;
      success: boolean;
      status: number;
      response: any;
      error?: string;
    }> = [];

    for (const order of signatureOrders) {
      for (const encoding of encodings) {
        console.log(`🧪 Testando: ${order} + ${encoding}`);
        
        const result = await testCombination(apiKey, apiSecret, passphrase, order, encoding);
        
        results.push({
          order,
          encoding,
          success: result.success,
          status: result.status,
          response: result.response,
          error: result.error
        });

        if (result.success && result.status === 200) {
          console.log('🎉 SUCESSO ENCONTRADO!');
          console.log('✅ Combinação vencedora:', { order, encoding });
          console.log('📊 Status:', result.status);
          console.log('📄 Resposta:', JSON.stringify(result.response, null, 2));
          successFound = true;
          break;
        } else {
          console.log(`❌ Falhou: ${result.status} - ${result.error || 'Unknown error'}`);
        }
      }
      
      if (successFound) break;
    }

    // 6. Relatório final
    console.log('=' .repeat(80));
    console.log('📊 RELATÓRIO FINAL DO TESTE BRUTEFORCE');
    console.log('=' .repeat(80));

    if (successFound) {
      const winningResult = results.find(r => r.success && r.status === 200);
      console.log('🎉 COMBINAÇÃO VENCEDORA ENCONTRADA:');
      console.log('📋 Ordem:', winningResult?.order);
      console.log('🔤 Codificação:', winningResult?.encoding);
      console.log('📊 Status:', winningResult?.status);
      console.log('📄 Resposta:', JSON.stringify(winningResult?.response, null, 2));
    } else {
      console.log('❌ NENHUMA COMBINAÇÃO FUNCIONOU');
      console.log('📊 Resumo dos resultados:');
      
      const statusCounts: { [key: number]: number } = {};
      results.forEach(r => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      });
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   Status ${status}: ${count} tentativas`);
      });
      
      console.log('🔍 Primeiros 5 resultados detalhados:');
      results.slice(0, 5).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.order} + ${result.encoding}: ${result.status} - ${result.error || 'OK'}`);
      });
    }

    console.log('=' .repeat(80));
    console.log('🏁 TESTE BRUTEFORCE CONCLUÍDO');

  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    process.exit(1);
  } finally {
    // Fechar conexão com o banco
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco de dados fechada');
  }
}

// Executar o script
if (require.main === module) {
  main().catch(console.error);
}

export { main };