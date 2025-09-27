#!/usr/bin/env tsx

/**
 * Script para atualizar credenciais LN Markets válidas
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Credenciais válidas da LN Markets
const VALID_CREDENTIALS = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  secret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==', 
  passphrase: '#PassCursor'
};

async function updateCredentials() {
  try {
    console.log('🔧 Atualizando credenciais LN Markets...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' }
    });

    if (!user) {
      console.error('❌ Usuário não encontrado');
      return;
    }

    // Atualizar credenciais
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ln_markets_api_key: VALID_CREDENTIALS.apiKey,
        ln_markets_api_secret: VALID_CREDENTIALS.secret,
        ln_markets_passphrase: VALID_CREDENTIALS.passphrase
      }
    });

    console.log('✅ Credenciais atualizadas com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar credenciais:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCredentials();
