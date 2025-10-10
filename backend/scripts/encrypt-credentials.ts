#!/usr/bin/env tsx

/**
 * Script para criptografar credenciais LN Markets existentes no banco de dados
 * 
 * Este script:
 * 1. Conecta ao banco de dados
 * 2. Busca credenciais em texto plano
 * 3. Criptografa usando AuthService
 * 4. Atualiza no banco de dados
 */

import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/auth.service';
import { config } from '../src/config/env';

async function encryptCredentials() {
  console.log('🔐 INICIANDO CRIPTOGRAFIA DE CREDENCIAIS LN MARKETS');
  
  // Usar URL do banco do Docker
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://axisor:axisor_dev_password@localhost:15432/axisor'
      }
    }
  });
  
  try {
    // Buscar usuário com credenciais
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
      select: {
        id: true,
        email: true,
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true,
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', user.email);
    console.log('🔍 Credenciais atuais:');
    console.log('  - API Key:', user.ln_markets_api_key);
    console.log('  - API Secret:', user.ln_markets_api_secret?.substring(0, 20) + '...');
    console.log('  - Passphrase:', user.ln_markets_passphrase);

    // Verificar se já estão criptografadas
    const isAlreadyEncrypted = user.ln_markets_api_key?.includes(':') && 
                              /^[0-9a-fA-F:]+$/.test(user.ln_markets_api_key);

    if (isAlreadyEncrypted) {
      console.log('✅ Credenciais já estão criptografadas');
      return;
    }

    // Criar instância do AuthService para criptografia
    const authService = new AuthService(prisma, {} as any);

    console.log('🔐 Criptografando credenciais...');

    // Criptografar cada credencial
    const encryptedApiKey = authService.encryptData(user.ln_markets_api_key!);
    const encryptedApiSecret = authService.encryptData(user.ln_markets_api_secret!);
    const encryptedPassphrase = authService.encryptData(user.ln_markets_passphrase!);

    console.log('✅ Credenciais criptografadas:');
    console.log('  - API Key:', encryptedApiKey.substring(0, 20) + '...');
    console.log('  - API Secret:', encryptedApiSecret.substring(0, 20) + '...');
    console.log('  - Passphrase:', encryptedPassphrase.substring(0, 20) + '...');

    // Atualizar no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ln_markets_api_key: encryptedApiKey,
        ln_markets_api_secret: encryptedApiSecret,
        ln_markets_passphrase: encryptedPassphrase,
      }
    });

    console.log('✅ Credenciais atualizadas no banco de dados');

    // Verificar se a descriptografia funciona
    console.log('🔓 Testando descriptografia...');
    const decryptedApiKey = authService.decryptData(encryptedApiKey);
    const decryptedApiSecret = authService.decryptData(encryptedApiSecret);
    const decryptedPassphrase = authService.decryptData(encryptedPassphrase);

    console.log('✅ Descriptografia funcionando:');
    console.log('  - API Key:', decryptedApiKey);
    console.log('  - API Secret:', decryptedApiSecret?.substring(0, 20) + '...');
    console.log('  - Passphrase:', decryptedPassphrase);

    console.log('🎉 CRIPTOGRAFIA CONCLUÍDA COM SUCESSO!');

  } catch (error: any) {
    console.error('❌ Erro durante criptografia:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
encryptCredentials().catch(console.error);
