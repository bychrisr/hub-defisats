/**
 * Script para Corrigir Credenciais Criptografadas
 * 
 * Este script ajuda a diagnosticar e corrigir problemas com credenciais criptografadas
 */

import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';

async function fixCredentials() {
  const prisma = new PrismaClient();
  const authService = new AuthService(prisma, {} as any);

  try {
    console.log('🔧 CORREÇÃO DE CREDENCIAIS');
    console.log('==========================');

    // 1. Verificar configuração atual
    console.log('\n1. CONFIGURAÇÃO ATUAL:');
    console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? 'Definida' : 'Não definida');
    console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY?.length || 'undefined');

    // 2. Buscar usuário
    console.log('\n2. BUSCANDO USUÁRIO:');
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

    // 3. Verificar se as credenciais existem
    console.log('\n3. VERIFICANDO CREDENCIAIS:');
    const hasCredentials = !!(user.ln_markets_api_key && user.ln_markets_api_secret && user.ln_markets_passphrase);
    console.log('Tem credenciais salvas:', hasCredentials);

    if (!hasCredentials) {
      console.log('ℹ️ Usuário não tem credenciais salvas. Pode inserir novas credenciais normalmente.');
      return;
    }

    // 4. Tentar descriptografar
    console.log('\n4. TENTATIVA DE DESCRIPTOGRAFIA:');
    let canDecrypt = false;
    
    try {
      if (user.ln_markets_api_key) {
        const decryptedKey = authService.decryptData(user.ln_markets_api_key);
        console.log('✅ API Key descriptografada com sucesso');
        console.log('API Key (first 10 chars):', decryptedKey.substring(0, 10) + '...');
        canDecrypt = true;
      }
    } catch (error: any) {
      console.log('❌ Erro ao descriptografar API Key:', error.message);
    }

    // 5. Se não conseguir descriptografar, limpar credenciais
    if (!canDecrypt) {
      console.log('\n5. LIMPANDO CREDENCIAIS ANTIGAS:');
      console.log('As credenciais foram salvas com uma chave de criptografia diferente.');
      console.log('Limpando credenciais antigas para permitir inserção de novas...');
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ln_markets_api_key: null,
          ln_markets_api_secret: null,
          ln_markets_passphrase: null,
          updated_at: new Date()
        }
      });

      console.log('✅ Credenciais antigas removidas');
      console.log('ℹ️ O usuário pode agora inserir novas credenciais no frontend');
    } else {
      console.log('\n5. CREDENCIAIS OK:');
      console.log('✅ As credenciais podem ser descriptografadas corretamente');
    }

    // 6. Teste de criptografia/descriptografia
    console.log('\n6. TESTE DE CRIPTOGRAFIA:');
    try {
      const testData = 'test-credential-123';
      console.log('Dados de teste:', testData);
      
      const encrypted = authService.encryptData(testData);
      console.log('Dados criptografados:', encrypted);
      
      const decrypted = authService.decryptData(encrypted);
      console.log('Dados descriptografados:', decrypted);
      
      if (testData === decrypted) {
        console.log('✅ Sistema de criptografia funcionando corretamente');
      } else {
        console.log('❌ Sistema de criptografia com problemas');
      }
    } catch (error: any) {
      console.log('❌ Erro no teste de criptografia:', error.message);
    }

  } catch (error: any) {
    console.error('❌ Erro no script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
fixCredentials().catch(console.error);
