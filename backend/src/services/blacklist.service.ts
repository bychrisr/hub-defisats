import { PrismaClient } from '@prisma/client';

/**
 * Blacklist Service
 * Gerencia lista negra de IPs, fingerprints e domínios de email
 */
export class BlacklistService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Verifica se um valor está na blacklist
   */
  async isBlacklisted(type: 'ip' | 'fingerprint' | 'email_domain', value: string): Promise<boolean> {
    const entry = await this.prisma.blacklist.findFirst({
      where: {
        type,
        value,
        OR: [
          { expires_at: null }, // Permanente
          { expires_at: { gt: new Date() } }, // Ainda válido
        ],
      },
    });

    return !!entry;
  }

  /**
   * Adiciona um valor à blacklist
   */
  async add(
    type: 'ip' | 'fingerprint' | 'email_domain',
    value: string,
    reason: string,
    expiresInHours?: number,
    autoAdded: boolean = false
  ): Promise<void> {
    const expires_at = expiresInHours 
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    await this.prisma.blacklist.upsert({
      where: {
        type_value: {
          type,
          value,
        },
      },
      create: {
        type,
        value,
        reason,
        auto_added: autoAdded,
        expires_at,
      },
      update: {
        reason: `${reason} (atualizado)`,
        expires_at,
        auto_added: autoAdded,
      },
    });

    console.log(`🚫 Blacklist: Added ${type} = ${value} (expires: ${expires_at || 'never'})`);
  }

  /**
   * Remove um valor da blacklist
   */
  async remove(type: 'ip' | 'fingerprint' | 'email_domain', value: string): Promise<void> {
    await this.prisma.blacklist.deleteMany({
      where: {
        type,
        value,
      },
    });

    console.log(`✅ Blacklist: Removed ${type} = ${value}`);
  }

  /**
   * Lista todas as entradas da blacklist
   */
  async list(type?: 'ip' | 'fingerprint' | 'email_domain') {
    return await this.prisma.blacklist.findMany({
      where: type ? { type } : undefined,
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Limpa entradas expiradas
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.blacklist.deleteMany({
      where: {
        expires_at: {
          lte: new Date(),
        },
      },
    });

    console.log(`🧹 Blacklist: Cleaned ${result.count} expired entries`);
    return result.count;
  }

  /**
   * Verifica múltiplos valores de uma vez
   */
  async checkMultiple(checks: Array<{ type: 'ip' | 'fingerprint' | 'email_domain', value: string }>): Promise<boolean> {
    for (const check of checks) {
      if (await this.isBlacklisted(check.type, check.value)) {
        console.log(`🚫 Blacklist: Blocked ${check.type} = ${check.value}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Obtém domínio de um email
   */
  private getEmailDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() || '';
  }

  /**
   * Verifica se email, IP ou fingerprint estão bloqueados
   */
  async checkRegistration(email: string, ip: string, fingerprint?: string): Promise<{
    isBlocked: boolean;
    reason?: string;
    type?: string;
  }> {
    const domain = this.getEmailDomain(email);
    
    // Verificar domínio
    if (await this.isBlacklisted('email_domain', domain)) {
      return { isBlocked: true, reason: 'Email domain is blacklisted', type: 'email_domain' };
    }

    // Verificar IP
    if (await this.isBlacklisted('ip', ip)) {
      return { isBlocked: true, reason: 'IP address is blacklisted', type: 'ip' };
    }

    // Verificar fingerprint
    if (fingerprint && await this.isBlacklisted('fingerprint', fingerprint)) {
      return { isBlocked: true, reason: 'Device is blacklisted', type: 'fingerprint' };
    }

    return { isBlocked: false };
  }
}


