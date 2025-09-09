import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '@/services/auth.service';
import { PrismaClient } from '@prisma/client';
// import { config } from '@/config/env';

// Interface for authenticated requests
// interface AuthenticatedRequest extends FastifyRequest {
//   user?: {
//     id: string;
//     email: string;
//     username: string;
//     plan_type: string;
//   };
// }

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Authorization header with Bearer token is required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Initialize auth service
    const prisma = new PrismaClient();
    const authService = new AuthService(prisma, null as any);

    // Validate token and get user
    const user = await authService.validateSession(token);

    // Attach user to request
    (request as any).user = user;

    // Close Prisma connection
    await prisma.$disconnect();
  } catch (error) {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: error instanceof Error ? error.message : 'Invalid token',
    });
  }
}

export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Initialize auth service
    const prisma = new PrismaClient();
    const authService = new AuthService(prisma, null as any);

    // Validate token and get user
    const user = await authService.validateSession(token);

    // Attach user to request
    (request as any).user = user;

    // Close Prisma connection
    await prisma.$disconnect();
  } catch (error) {
    // Invalid token, but continue without authentication
    // This is optional auth, so we don't return an error
    return;
  }
}

export async function adminAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // First, authenticate the user
    await authMiddleware(request, reply);

    // Check if user is admin
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    // Check if user has admin role
    const prisma = new PrismaClient();
    const adminUser = await prisma.adminUser.findUnique({
      where: { user_id: user.id },
    });

    await prisma.$disconnect();

    if (!adminUser) {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }

    // Attach admin info to request
    (request as any).user = { 
      id: user.id,
      email: user.email,
      username: user.username,
      plan_type: user.plan_type
    };
  } catch (error) {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}

export async function superAdminAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // First, authenticate the user
    await authMiddleware(request, reply);

    // Check if user is superadmin
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    // Check if user has superadmin role
    const prisma = new PrismaClient();
    const adminUser = await prisma.adminUser.findUnique({
      where: { user_id: user.id },
    });

    await prisma.$disconnect();

    if (!adminUser || adminUser.role !== 'superadmin') {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Superadmin access required',
      });
    }

    // Attach admin info to request
    (request as any).user = { 
      id: user.id,
      email: user.email,
      username: user.username,
      plan_type: user.plan_type
    };
  } catch (error) {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}

export async function planAuthMiddleware(requiredPlan: string) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      // First, authenticate the user
      await authMiddleware(request, reply);

      // Check if user has required plan
      const user = (request as any).user;
      if (!user) {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Define plan hierarchy
      const planHierarchy = {
        free: 0,
        basic: 1,
        advanced: 2,
        pro: 3,
      };

      const userPlanLevel =
        planHierarchy[user.plan_type as keyof typeof planHierarchy] || 0;
      const requiredPlanLevel =
        planHierarchy[requiredPlan as keyof typeof planHierarchy] || 0;

      if (userPlanLevel < requiredPlanLevel) {
        return reply.status(403).send({
          error: 'PLAN_LIMIT_EXCEEDED',
          message: `${requiredPlan} plan or higher is required`,
          current_plan: user.plan_type,
          required_plan: requiredPlan,
        });
      }
    } catch (error) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message:
          error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  };
}
