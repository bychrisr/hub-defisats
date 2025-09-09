import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      username: string;
      plan_type: string;
    };
  }
}

const prisma = new PrismaClient();

/**
 * Validação de IDOR para recursos de usuário
 */
export async function validateUserResourceAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  resourceUserId: string
): Promise<boolean> {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    // Verificar se o usuário tem acesso ao recurso
    if (user.id === resourceUserId) {
      return true;
    }

    // Verificar se o usuário é admin
    const adminUser = await prisma.adminUser.findUnique({
      where: { user_id: user.id },
    });

    if (adminUser) {
      return true;
    }

    return reply.status(403).send({
      error: 'FORBIDDEN',
      message: 'Access denied to this resource',
    });
  } catch (error) {
    console.error('IDOR validation error:', error);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to validate resource access',
    });
  }
}

/**
 * Middleware para validar acesso a recursos de usuário específico
 */
export function requireUserResourceAccess(
  resourceUserIdParam: string = 'userId'
) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const resourceUserId = (request.params as Record<string, string>)[resourceUserIdParam];

    if (!resourceUserId) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'Resource user ID is required',
      });
    }

    const hasAccess = await validateUserResourceAccess(
      request,
      reply,
      resourceUserId
    );
    if (!hasAccess) {
      return; // Response já foi enviada
    }
  };
}

/**
 * Validação de IDOR para recursos de automação
 */
export async function validateAutomationAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  automationId: string
): Promise<boolean> {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    // Buscar automação no banco
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
      select: { user_id: true },
    });

    if (!automation) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'Automation not found',
      });
    }

    // Verificar se o usuário é dono da automação
    if (automation.user_id === user.id) {
      return true;
    }

    // Verificar se o usuário é admin
    const adminUser = await prisma.adminUser.findUnique({
      where: { user_id: user.id },
    });

    if (adminUser) {
      return true;
    }

    return reply.status(403).send({
      error: 'FORBIDDEN',
      message: 'Access denied to this automation',
    });
  } catch (error) {
    console.error('Automation IDOR validation error:', error);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to validate automation access',
    });
  }
}

/**
 * Middleware para validar acesso a automações
 */
export function requireAutomationAccess(
  automationIdParam: string = 'automationId'
) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const automationId = (request.params as Record<string, string>)[automationIdParam];

    if (!automationId) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'Automation ID is required',
      });
    }

    const hasAccess = await validateAutomationAccess(
      request,
      reply,
      automationId
    );
    if (!hasAccess) {
      return; // Response já foi enviada
    }
  };
}

/**
 * Validação de IDOR para recursos de trade logs
 */
export async function validateTradeLogAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  tradeLogId: string
): Promise<boolean> {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    // Buscar trade log no banco
    const tradeLog = await prisma.tradeLog.findUnique({
      where: { id: tradeLogId },
      select: { user_id: true },
    });

    if (!tradeLog) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'Trade log not found',
      });
    }

    // Verificar se o usuário é dono do trade log
    if (tradeLog.user_id === user.id) {
      return true;
    }

    // Verificar se o usuário é admin
    const adminUser = await prisma.adminUser.findUnique({
      where: { user_id: user.id },
    });

    if (adminUser) {
      return true;
    }

    return reply.status(403).send({
      error: 'FORBIDDEN',
      message: 'Access denied to this trade log',
    });
  } catch (error) {
    console.error('Trade log IDOR validation error:', error);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to validate trade log access',
    });
  }
}

/**
 * Middleware para validar acesso a trade logs
 */
export function requireTradeLogAccess(tradeLogIdParam: string = 'tradeLogId') {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const tradeLogId = (request.params as Record<string, string>)[tradeLogIdParam];

    if (!tradeLogId) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'Trade log ID is required',
      });
    }

    const hasAccess = await validateTradeLogAccess(request, reply, tradeLogId);
    if (!hasAccess) {
      return; // Response já foi enviada
    }
  };
}

/**
 * Validação genérica de IDOR baseada em campo de usuário
 */
export function requireResourceAccess(
  resourceIdParam: string,
  tableName: string,
  userIdField: string = 'user_id'
) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const user = request.user;
      if (!user) {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const resourceId = (request.params as Record<string, string>)[resourceIdParam];
      if (!resourceId) {
        return reply.status(400).send({
          error: 'BAD_REQUEST',
          message: 'Resource ID is required',
        });
      }

      // Verificar se o usuário é admin
      const adminUser = await prisma.adminUser.findUnique({
        where: { user_id: user.id },
      });

      if (adminUser) {
        return; // Admin tem acesso a tudo
      }

      // Buscar recurso no banco
      const resource = await (prisma as Record<string, any>)[tableName].findUnique({
        where: { id: resourceId },
        select: { [userIdField]: true },
      });

      if (!resource) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'Resource not found',
        });
      }

      // Verificar se o usuário é dono do recurso
      if (resource[userIdField] === user.id) {
        return;
      }

      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Access denied to this resource',
      });
    } catch (error) {
      console.error('Generic IDOR validation error:', error);
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to validate resource access',
      });
    }
  };
}
