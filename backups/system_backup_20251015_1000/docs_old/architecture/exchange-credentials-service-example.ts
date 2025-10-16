// Exemplo de serviço para gerenciar credenciais de exchanges
// Este é um exemplo de como seria implementado o serviço após a migração

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

export class ExchangeCredentialsService {
  private prisma: PrismaClient;
  private encryptionKey: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.encryptionKey = process.env.CREDENTIALS_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  // Criptografar credenciais
  private encryptCredentials(credentials: Record<string, string>): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('credentials'));
    
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }

  // Descriptografar credenciais
  private decryptCredentials(encryptedData: string): Record<string, string> {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('credentials'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Obter todas as exchanges ativas
  async getActiveExchanges() {
    return await this.prisma.exchange.findMany({
      where: { is_active: true },
      include: {
        credential_types: {
          orderBy: { order: 'asc' }
        }
      }
    });
  }

  // Obter tipos de credenciais para uma exchange
  async getCredentialTypes(exchangeSlug: string) {
    return await this.prisma.exchangeCredentialType.findMany({
      where: {
        exchange: { slug: exchangeSlug }
      },
      orderBy: { order: 'asc' }
    });
  }

  // Salvar credenciais do usuário
  async saveUserCredentials(
    userId: string, 
    exchangeSlug: string, 
    credentials: Record<string, string>
  ) {
    const exchange = await this.prisma.exchange.findUnique({
      where: { slug: exchangeSlug }
    });

    if (!exchange) {
      throw new Error(`Exchange ${exchangeSlug} not found`);
    }

    // Validar credenciais obrigatórias
    const requiredFields = await this.prisma.exchangeCredentialType.findMany({
      where: {
        exchange_id: exchange.id,
        is_required: true
      }
    });

    for (const field of requiredFields) {
      if (!credentials[field.field_name]) {
        throw new Error(`Required field ${field.name} is missing`);
      }
    }

    // Criptografar credenciais
    const encryptedCredentials = this.encryptCredentials(credentials);

    // Salvar ou atualizar credenciais
    return await this.prisma.userExchangeCredentials.upsert({
      where: {
        user_id_exchange_id: {
          user_id: userId,
          exchange_id: exchange.id
        }
      },
      update: {
        credentials: encryptedCredentials,
        is_verified: false, // Reset verification status
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        exchange_id: exchange.id,
        credentials: encryptedCredentials,
        is_active: true,
        is_verified: false
      }
    });
  }

  // Obter credenciais do usuário para uma exchange
  async getUserCredentials(userId: string, exchangeSlug: string) {
    const userCredentials = await this.prisma.userExchangeCredentials.findUnique({
      where: {
        user_id_exchange_id: {
          user_id: userId,
          exchange_id: (await this.prisma.exchange.findUnique({
            where: { slug: exchangeSlug }
          }))?.id || ''
        }
      },
      include: {
        exchange: true
      }
    });

    if (!userCredentials) {
      return null;
    }

    // Descriptografar credenciais
    const decryptedCredentials = this.decryptCredentials(userCredentials.credentials as string);

    return {
      ...userCredentials,
      credentials: decryptedCredentials
    };
  }

  // Testar credenciais
  async testCredentials(userId: string, exchangeSlug: string) {
    const userCredentials = await this.getUserCredentials(userId, exchangeSlug);
    
    if (!userCredentials) {
      throw new Error('No credentials found for this exchange');
    }

    try {
      // Aqui você implementaria a lógica específica para testar cada exchange
      const isValid = await this.validateExchangeCredentials(exchangeSlug, userCredentials.credentials);
      
      // Atualizar status de verificação
      await this.prisma.userExchangeCredentials.update({
        where: { id: userCredentials.id },
        data: {
          is_verified: isValid,
          last_test: new Date()
        }
      });

      return { isValid, message: isValid ? 'Credentials are valid' : 'Invalid credentials' };
    } catch (error) {
      await this.prisma.userExchangeCredentials.update({
        where: { id: userCredentials.id },
        data: {
          is_verified: false,
          last_test: new Date()
        }
      });

      throw error;
    }
  }

  // Validar credenciais específicas da exchange (implementar para cada exchange)
  private async validateExchangeCredentials(
    exchangeSlug: string, 
    credentials: Record<string, string>
  ): Promise<boolean> {
    switch (exchangeSlug) {
      case 'ln-markets':
        return await this.validateLNMarketsCredentials(credentials);
      case 'binance':
        return await this.validateBinanceCredentials(credentials);
      // Adicionar outras exchanges conforme necessário
      default:
        throw new Error(`Validation not implemented for exchange: ${exchangeSlug}`);
    }
  }

  // Validação específica para LN Markets
  private async validateLNMarketsCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      // Implementar validação real da API da LN Markets
      const response = await fetch('https://api.lnmarkets.com/v1/user', {
        method: 'GET',
        headers: {
          'X-API-KEY': credentials.api_key,
          'X-API-SECRET': credentials.api_secret,
          'X-API-PASSPHRASE': credentials.passphrase,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('LN Markets validation error:', error);
      return false;
    }
  }

  // Validação específica para Binance (exemplo futuro)
  private async validateBinanceCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      // Implementar validação real da API da Binance
      const response = await fetch('https://api.binance.com/api/v3/account', {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': credentials.api_key,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Binance validation error:', error);
      return false;
    }
  }

  // Obter todas as credenciais do usuário
  async getAllUserCredentials(userId: string) {
    const userCredentials = await this.prisma.userExchangeCredentials.findMany({
      where: { user_id: userId },
      include: {
        exchange: true
      }
    });

    return userCredentials.map(cred => ({
      ...cred,
      credentials: this.decryptCredentials(cred.credentials as string)
    }));
  }

  // Remover credenciais do usuário
  async removeUserCredentials(userId: string, exchangeSlug: string) {
    const exchange = await this.prisma.exchange.findUnique({
      where: { slug: exchangeSlug }
    });

    if (!exchange) {
      throw new Error(`Exchange ${exchangeSlug} not found`);
    }

    return await this.prisma.userExchangeCredentials.delete({
      where: {
        user_id_exchange_id: {
          user_id: userId,
          exchange_id: exchange.id
        }
      }
    });
  }

  // Atualizar status de verificação
  async updateVerificationStatus(userId: string, exchangeSlug: string, isVerified: boolean) {
    const exchange = await this.prisma.exchange.findUnique({
      where: { slug: exchangeSlug }
    });

    if (!exchange) {
      throw new Error(`Exchange ${exchangeSlug} not found`);
    }

    return await this.prisma.userExchangeCredentials.update({
      where: {
        user_id_exchange_id: {
          user_id: userId,
          exchange_id: exchange.id
        }
      },
      data: {
        is_verified: isVerified,
        last_test: new Date()
      }
    });
  }
}

// Exemplo de uso no controller
export class ExchangeCredentialsController {
  private credentialsService: ExchangeCredentialsService;

  constructor(prisma: PrismaClient) {
    this.credentialsService = new ExchangeCredentialsService(prisma);
  }

  // Endpoint para obter exchanges disponíveis
  async getExchanges() {
    return await this.credentialsService.getActiveExchanges();
  }

  // Endpoint para salvar credenciais
  async saveCredentials(userId: string, exchangeSlug: string, credentials: Record<string, string>) {
    return await this.credentialsService.saveUserCredentials(userId, exchangeSlug, credentials);
  }

  // Endpoint para testar credenciais
  async testCredentials(userId: string, exchangeSlug: string) {
    return await this.credentialsService.testCredentials(userId, exchangeSlug);
  }

  // Endpoint para obter credenciais do usuário
  async getUserCredentials(userId: string, exchangeSlug: string) {
    return await this.credentialsService.getUserCredentials(userId, exchangeSlug);
  }
}
