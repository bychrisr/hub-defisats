/**
 * Script de Diagnóstico de Credenciais
 * 
 * Este script ajuda a diagnosticar problemas com a criptografia/descriptografia
 * das credenciais da LN Markets
 */

import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import * as config from '../config/env';

async function diagnoseCredentials() {
  const prisma = new PrismaClient();
  const authService = new AuthService(prisma, {} as any);

  try {
    console.log('🔍 DIAGNÓSTICO DE CREDENCIAIS');
    console.log('================================');

    // 1. Verificar configuração de criptografia
    console.log('\n1. CONFIGURAÇÃO DE CRIPTOGRAFIA:');
    console.log('ENCRYPTION_KEY length:', config.security.encryption.key.length);
    console.log('ENCRYPTION_KEY (first 10 chars):', config.security.encryption.key.substring(0, 10) + '...');

    // 2. Buscar usuário com credenciais
    console.log('\n2. BUSCANDO USUÁRIO COM CREDENCIAIS:');
    const user = await prisma.user.findFirst({
      where: {
        email: 'brainoschris@gmail.com'
      },
      select: {
        id: true,
        email: true,
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', user.email);
    console.log('ID:', user.id);
    console.log('Criado em:', user.created_at);
    console.log('Atualizado em:', user.updated_at);

    // 3. Verificar formato das credenciais criptografadas
    console.log('\n3. FORMATO DAS CREDENCIAIS CRIPTOGRAFADAS:');
    
    if (user.ln_markets_api_key) {
      console.log('API Key length:', user.ln_markets_api_key.length);
      console.log('API Key format:', user.ln_markets_api_key.includes(':') ? 'Formato correto (iv:encrypted)' : 'Formato incorreto');
      console.log('API Key (first 50 chars):', user.ln_markets_api_key.substring(0, 50) + '...');
    } else {
      console.log('❌ API Key não encontrada');
    }

    if (user.ln_markets_api_secret) {
      console.log('API Secret length:', user.ln_markets_api_secret.length);
      console.log('API Secret format:', user.ln_markets_api_secret.includes(':') ? 'Formato correto (iv:encrypted)' : 'Formato incorreto');
      console.log('API Secret (first 50 chars):', user.ln_markets_api_secret.substring(0, 50) + '...');
    } else {
      console.log('❌ API Secret não encontrada');
    }

    if (user.ln_markets_passphrase) {
      console.log('Passphrase length:', user.ln_markets_passphrase.length);
      console.log('Passphrase format:', user.ln_markets_passphrase.includes(':') ? 'Formato correto (iv:encrypted)' : 'Formato incorreto');
      console.log('Passphrase (first 50 chars):', user.ln_markets_passphrase.substring(0, 50) + '...');
    } else {
      console.log('❌ Passphrase não encontrada');
    }

    // 4. Tentar descriptografar as credenciais
    console.log('\n4. TENTATIVA DE DESCRIPTOGRAFIA:');
    
    if (user.ln_markets_api_key) {
      try {
        console.log('🔓 Tentando descriptografar API Key...');
        const decryptedKey = authService.decryptData(user.ln_markets_api_key);
        console.log('✅ API Key descriptografada com sucesso');
        console.log('API Key (first 10 chars):', decryptedKey.substring(0, 10) + '...');
        console.log('API Key length:', decryptedKey.length);
      } catch (error: any) {
        console.log('❌ Erro ao descriptografar API Key:', error.message);
        console.log('Tipo do erro:', error.constructor.name);
      }
    }

    if (user.ln_markets_api_secret) {
      try {
        console.log('🔓 Tentando descriptografar API Secret...');
        const decryptedSecret = authService.decryptData(user.ln_markets_api_secret);
        console.log('✅ API Secret descriptografada com sucesso');
        console.log('API Secret (first 10 chars):', decryptedSecret.substring(0, 10) + '...');
        console.log('API Secret length:', decryptedSecret.length);
      } catch (error: any) {
        console.log('❌ Erro ao descriptografar API Secret:', error.message);
        console.log('Tipo do erro:', error.constructor.name);
      }
    }

    if (user.ln_markets_passphrase) {
      try {
        console.log('🔓 Tentando descriptografar Passphrase...');
        const decryptedPassphrase = authService.decryptData(user.ln_markets_passphrase);
        console.log('✅ Passphrase descriptografada com sucesso');
        console.log('Passphrase (first 10 chars):', decryptedPassphrase.substring(0, 10) + '...');
        console.log('Passphrase length:', decryptedPassphrase.length);
      } catch (error: any) {
        console.log('❌ Erro ao descriptografar Passphrase:', error.message);
        console.log('Tipo do erro:', error.constructor.name);
      }
    }

    // 5. Teste de criptografia/descriptografia
    console.log('\n5. TESTE DE CRIPTOGRAFIA/DESCRIPTOGRAFIA:');
    try {
      const testData = 'test-credential-123';
      console.log('Dados de teste:', testData);
      
      const encrypted = authService.encryptData(testData);
      console.log('Dados criptografados:', encrypted);
      
      const decrypted = authService.decryptData(encrypted);
      console.log('Dados descriptografados:', decrypted);
      
      if (testData === decrypted) {
        console.log('✅ Teste de criptografia/descriptografia passou');
      } else {
        console.log('❌ Teste de criptografia/descriptografia falhou');
      }
    } catch (error: any) {
      console.log('❌ Erro no teste de criptografia:', error.message);
    }

    // 6. Verificar se as credenciais são válidas para LN Markets
    console.log('\n6. VALIDAÇÃO DAS CREDENCIAIS LN MARKETS:');
    if (user.ln_markets_api_key && user.ln_markets_api_secret && user.ln_markets_passphrase) {
      try {
        const decryptedKey = authService.decryptData(user.ln_markets_api_key);
        const decryptedSecret = authService.decryptData(user.ln_markets_api_secret);
        const decryptedPassphrase = authService.decryptData(user.ln_markets_passphrase);
        
        console.log('API Key válida:', decryptedKey.startsWith('lnm_'));
        console.log('API Secret válida:', decryptedSecret.length >= 16);
        console.log('Passphrase válida:', decryptedPassphrase.length >= 8);
        
        if (decryptedKey.startsWith('lnm_') && decryptedSecret.length >= 16 && decryptedPassphrase.length >= 8) {
          console.log('✅ Todas as credenciais parecem válidas');
        } else {
          console.log('❌ Algumas credenciais parecem inválidas');
        }
      } catch (error: any) {
        console.log('❌ Não foi possível validar as credenciais:', error.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o diagnóstico
diagnoseCredentials().catch(console.error);
