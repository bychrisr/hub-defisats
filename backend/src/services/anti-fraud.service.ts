import { PrismaClient } from '@prisma/client';
import { BlacklistService } from './blacklist.service';

interface RiskFactor {
  factor: string;
  score: number;
  description: string;
}

interface RiskAssessment {
  riskScore: number;
  factors: RiskFactor[];
  recommendation: 'approve' | 'verify' | 'block';
  requiresVerification: boolean;
}

/**
 * Anti-Fraud Service
 * Sistema de detecção e prevenção de fraudes em cupons e registros
 */
export class AntiFraudService {
  private blacklistService: BlacklistService;

  constructor(private prisma: PrismaClient) {
    this.blacklistService = new BlacklistService(prisma);
  }

  /**
   * Calcula score de risco (0-100)
   * Quanto maior, mais suspeito
   */
  async calculateRiskScore(
    ip: string,
    email: string,
    fingerprint?: string,
    couponId?: string
  ): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // 1. Verificar blacklist primeiro
    const blacklistCheck = await this.blacklistService.checkRegistration(email, ip, fingerprint);
    if (blacklistCheck.isBlocked) {
      factors.push({
        factor: 'blacklisted',
        score: 100,
        description: `Bloqueado: ${blacklistCheck.reason}`,
      });
      return {
        riskScore: 100,
        factors,
        recommendation: 'block',
        requiresVerification: false,
      };
    }

    // 2. Verificar uso do mesmo IP em 24h
    const ipUsageScore = await this.checkIPUsage(ip);
    if (ipUsageScore > 0) {
      factors.push({
        factor: 'ip_reuse',
        score: ipUsageScore,
        description: `IP usado ${Math.floor(ipUsageScore / 10)} vez(es) nas últimas 24h`,
      });
      totalScore += ipUsageScore;
    }

    // 3. Verificar fingerprint duplicado
    if (fingerprint) {
      const fingerprintScore = await this.checkFingerprintUsage(fingerprint);
      if (fingerprintScore > 0) {
        factors.push({
          factor: 'fingerprint_reuse',
          score: fingerprintScore,
          description: `Dispositivo usado ${Math.floor(fingerprintScore / 15)} vez(es)`,
        });
        totalScore += fingerprintScore;
      }
    }

    // 4. Verificar email temporário/descartável
    const tempEmailScore = this.checkTemporaryEmail(email);
    if (tempEmailScore > 0) {
      factors.push({
        factor: 'temporary_email',
        score: tempEmailScore,
        description: 'Email temporário ou descartável detectado',
      });
      totalScore += tempEmailScore;
    }

    // 5. Verificar VPN/Proxy (análise básica de IP)
    const vpnScore = await this.checkVPNProxy(ip);
    if (vpnScore > 0) {
      factors.push({
        factor: 'vpn_proxy',
        score: vpnScore,
        description: 'Possível uso de VPN ou Proxy',
      });
      totalScore += vpnScore;
    }

    // 6. Verificar velocidade de registro (múltiplas tentativas rápidas)
    const velocityScore = await this.checkRegistrationVelocity(ip);
    if (velocityScore > 0) {
      factors.push({
        factor: 'high_velocity',
        score: velocityScore,
        description: 'Múltiplas tentativas de registro em curto período',
      });
      totalScore += velocityScore;
    }

    // 7. Verificar uso específico do cupom
    if (couponId) {
      const couponScore = await this.checkCouponAbuse(couponId, ip, fingerprint);
      if (couponScore > 0) {
        factors.push({
          factor: 'coupon_abuse',
          score: couponScore,
          description: 'Cupom usado múltiplas vezes',
        });
        totalScore += couponScore;
      }
    }

    // Determinar recomendação
    let recommendation: 'approve' | 'verify' | 'block';
    let requiresVerification = false;

    if (totalScore >= 71) {
      recommendation = 'block';
    } else if (totalScore >= 30) {
      recommendation = 'verify';
      requiresVerification = true;
    } else {
      recommendation = 'approve';
    }

    return {
      riskScore: Math.min(totalScore, 100),
      factors,
      recommendation,
      requiresVerification,
    };
  }

  /**
   * Verifica uso do mesmo IP nas últimas 24h
   */
  private async checkIPUsage(ip: string): Promise<number> {
    const count = await this.prisma.couponUsage.count({
      where: {
        ip_address: ip,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // +20 por cada uso adicional (0, 20, 40, 60...)
    return Math.min(count * 20, 60);
  }

  /**
   * Verifica uso do mesmo fingerprint
   */
  private async checkFingerprintUsage(fingerprint: string): Promise<number> {
    const count = await this.prisma.couponUsage.count({
      where: {
        device_fingerprint: fingerprint,
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias
        },
      },
    });

    // +30 por cada uso adicional
    return Math.min(count * 30, 90);
  }

  /**
   * Verifica se email é temporário/descartável
   */
  private checkTemporaryEmail(email: string): number {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    
    // Lista de domínios temporários conhecidos
    const tempDomains = [
      'temp-mail.org', 'guerrillamail.com', '10minutemail.com',
      'throwaway.email', 'tempmail.com', 'mailinator.com',
      'yopmail.com', 'maildrop.cc', 'trashmail.com',
      'getnada.com', 'temp-mail.io', 'mohmal.com',
    ];

    return tempDomains.includes(domain) ? 40 : 0;
  }

  /**
   * Verifica se IP é de VPN/Proxy (análise básica)
   * TODO: Integrar com serviço de detecção de VPN (IPQualityScore, IPHub, etc)
   */
  private async checkVPNProxy(ip: string): Promise<number> {
    // Verificação básica de ranges conhecidos de VPN
    // Em produção, usar serviço especializado
    
    // IPs de localhost/privados sempre passam
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 0;
    }

    // Análise básica: verificar se há múltiplos registros recentes deste IP
    // VPNs costumam ter muitos usuários diferentes
    const distinctUsers = await this.prisma.couponUsage.groupBy({
      by: ['user_id'],
      where: {
        ip_address: ip,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Se >5 usuários diferentes do mesmo IP em 24h, suspeito
    return distinctUsers.length > 5 ? 25 : 0;
  }

  /**
   * Verifica velocidade de registro (múltiplas tentativas)
   */
  private async checkRegistrationVelocity(ip: string): Promise<number> {
    const count = await this.prisma.couponUsage.count({
      where: {
        ip_address: ip,
        created_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hora
        },
      },
    });

    // 3+ tentativas em 1 hora = suspeito
    return count >= 3 ? 15 : 0;
  }

  /**
   * Verifica abuso específico de cupom
   */
  private async checkCouponAbuse(couponId: string, ip: string, fingerprint?: string): Promise<number> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        coupon_usages: {
          where: {
            created_at: {
              gte: new Date(Date.now() - (coupon?.cooldown_period_hours || 168) * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    if (!coupon) return 0;

    let score = 0;

    // Verificar limite por IP
    const ipCount = coupon.coupon_usages.filter(u => u.ip_address === ip).length;
    if (coupon.max_uses_per_ip && ipCount >= coupon.max_uses_per_ip) {
      score += 30;
    }

    // Verificar limite por fingerprint
    if (fingerprint) {
      const fingerprintCount = coupon.coupon_usages.filter(u => u.device_fingerprint === fingerprint).length;
      if (coupon.max_uses_per_fingerprint && fingerprintCount >= coupon.max_uses_per_fingerprint) {
        score += 30;
      }
    }

    return score;
  }

  /**
   * Registra uso de cupom com tracking completo
   */
  async trackCouponUsage(
    couponId: string,
    userId: string,
    ip: string,
    userAgent: string,
    fingerprint?: string,
    riskScore?: number
  ): Promise<void> {
    await this.prisma.couponUsage.create({
      data: {
        coupon_id: couponId,
        user_id: userId,
        ip_address: ip,
        device_fingerprint: fingerprint,
        user_agent: userAgent,
        risk_score: riskScore || 0,
      },
    });

    console.log(`📊 Coupon usage tracked: ${couponId} by ${userId} (risk: ${riskScore})`);
  }

  /**
   * Registra log de risco
   */
  async logRisk(
    userId: string | null,
    ip: string,
    fingerprint: string | undefined,
    riskScore: number,
    factors: RiskFactor[],
    actionTaken: 'approved' | 'email_verification' | 'blocked'
  ): Promise<void> {
    await this.prisma.riskLog.create({
      data: {
        user_id: userId,
        ip_address: ip,
        device_fingerprint: fingerprint,
        risk_score: riskScore,
        factors: factors as any,
        action_taken: actionTaken,
      },
    });

    console.log(`📝 Risk logged: ${ip} - Score: ${riskScore} - Action: ${actionTaken}`);
  }

  /**
   * Adiciona automaticamente à blacklist se padrão suspeito for detectado
   */
  async autoBlacklistIfNeeded(ip: string, fingerprint?: string): Promise<void> {
    // Verificar se IP teve 5+ registros em 24h
    const ipCount = await this.prisma.couponUsage.count({
      where: {
        ip_address: ip,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (ipCount >= 5) {
      await this.blacklistService.add(
        'ip',
        ip,
        `Auto-bloqueado: ${ipCount} registros em 24h`,
        24, // Bloquear por 24h
        true
      );
    }

    // Verificar se fingerprint teve 3+ registros em 7 dias
    if (fingerprint) {
      const fingerprintCount = await this.prisma.couponUsage.count({
        where: {
          device_fingerprint: fingerprint,
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (fingerprintCount >= 3) {
        await this.blacklistService.add(
          'fingerprint',
          fingerprint,
          `Auto-bloqueado: ${fingerprintCount} registros em 7 dias`,
          168, // Bloquear por 7 dias
          true
        );
      }
    }
  }

  /**
   * Obtém estatísticas de uso de cupom
   */
  async getCouponUsageStats(couponId: string, ip?: string, fingerprint?: string) {
    const where: any = { coupon_id: couponId };
    
    if (ip || fingerprint) {
      where.OR = [];
      if (ip) where.OR.push({ ip_address: ip });
      if (fingerprint) where.OR.push({ device_fingerprint: fingerprint });
    }

    const usages = await this.prisma.couponUsage.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return {
      total: usages.length,
      byIP: ip ? usages.filter(u => u.ip_address === ip).length : 0,
      byFingerprint: fingerprint ? usages.filter(u => u.device_fingerprint === fingerprint).length : 0,
      recentUsages: usages,
    };
  }

  /**
   * Gera código de verificação de 6 dígitos
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Extrai IP real do request (considerando proxies)
   */
  extractRealIP(request: any): string {
    return (
      request.headers['x-real-ip'] ||
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.ip ||
      request.connection?.remoteAddress ||
      '127.0.0.1'
    );
  }

  /**
   * Extrai User-Agent do request
   */
  extractUserAgent(request: any): string {
    return request.headers['user-agent'] || 'Unknown';
  }

  /**
   * Valida se código de verificação está correto
   */
  async validateVerificationCode(
    sessionToken: string,
    code: string
  ): Promise<{ valid: boolean; expired: boolean }> {
    const progress = await this.prisma.registrationProgress.findFirst({
      where: {
        session_token: sessionToken,
        verification_code: code,
      },
    });

    if (!progress) {
      return { valid: false, expired: false };
    }

    if (!progress.verification_code_expires) {
      return { valid: false, expired: true };
    }

    const isExpired = progress.verification_code_expires < new Date();
    
    return {
      valid: !isExpired,
      expired: isExpired,
    };
  }
}


