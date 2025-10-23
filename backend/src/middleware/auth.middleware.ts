import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { getPrisma } from '../lib/prisma'; // Import getPrisma singleton
// import { config } from '../config/env';

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
    console.log('🚀 AUTH MIDDLEWARE - Starting authentication check');
    console.log('🔍 AUTH MIDDLEWARE - Request details:', {
      url: request.url,
      method: request.method,
      headers: {
        authorization: request.headers.authorization ? 'Bearer [REDACTED]' : 'None',
        contentType: request.headers['content-type'],
        userAgent: request.headers['user-agent']
      },
      timestamp: new Date().toISOString()
    });
    
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ AUTH MIDDLEWARE - No valid authorization header:', {
        authHeader: authHeader ? 'Present but invalid format' : 'Missing',
        expectedFormat: 'Bearer <token>'
      });
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Authorization header with Bearer token is required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 AUTH MIDDLEWARE - Token extracted:', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...',
      tokenEnd: '...' + token.substring(token.length - 20),
      fullToken: token,
      timestamp: new Date().toISOString(),
      requestUrl: request.url,
      requestMethod: request.method
    });

    // Initialize auth service with singleton Prisma instance
    console.log('🔍 AUTH MIDDLEWARE - Initializing auth service');
    const prisma = await getPrisma(); // Use singleton getPrisma()
    const authService = new AuthService(prisma, request.server);

    // Validate token and get user
    console.log('🔍 AUTH MIDDLEWARE - Validating session with token...');
    try {
      const user = await authService.validateSession(token);
      console.log('🔍 AUTH MIDDLEWARE - User from validateSession:', {
        userId: user?.id,
        userEmail: user?.email,
        username: user?.username,
        planType: user?.plan_type,
        hasUser: !!user
      });

      if (!user) {
        console.log('❌ AUTH MIDDLEWARE - No user returned from validateSession');
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Invalid session',
        });
      }

      // Attach user to request
      (request as any).user = user;
      console.log('✅ AUTH MIDDLEWARE - User attached to request successfully');

      // Note: No need to disconnect - using singleton instance
      console.log('✅ AUTH MIDDLEWARE - Authentication successful');
    } catch (validationError) {
      console.error('❌ AUTH MIDDLEWARE - Session validation failed:', {
        error: validationError.message,
        stack: validationError.stack,
        token: token.substring(0, 50) + '...'
      });
      throw validationError;
    }
  } catch (error) {
    console.log('❌ AUTH MIDDLEWARE - Error:', error);
    console.log('❌ AUTH MIDDLEWARE - Error stack:', (error as Error).stack);
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

    // Initialize auth service with singleton Prisma instance
    const prisma = await getPrisma(); // Use singleton getPrisma()
    const authService = new AuthService(prisma, request.server);

    // Validate token and get user
    const user = await authService.validateSession(token);

    // Attach user to request
    (request as any).user = user;

    // Note: No need to disconnect - using singleton instance
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
    console.log('🔍 ADMIN AUTH MIDDLEWARE - Starting authentication check');
    console.log('🔍 Request URL:', request.url);
    console.log('🔍 Headers:', request.headers.authorization);
    
    // First, authenticate the user
    await authMiddleware(request, reply);

    // Check if user is admin
    const user = (request as any).user;
    console.log('🔍 ADMIN AUTH MIDDLEWARE - User from authMiddleware:', user?.email, 'ID:', user?.id);
    
    if (!user) {
      console.log('❌ ADMIN AUTH MIDDLEWARE - No user found from authMiddleware');
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    // Check if user has admin role using singleton Prisma instance
    const prisma = await getPrisma(); // Use singleton getPrisma()
    const adminUser = await prisma.adminUser.findUnique({
      where: { user_id: user.id },
    });

    // Note: No need to disconnect - using singleton instance

    console.log('🔍 ADMIN AUTH MIDDLEWARE - Admin user found:', adminUser);

    if (!adminUser) {
      console.log('❌ ADMIN AUTH MIDDLEWARE - User is not admin');
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }

    console.log('✅ ADMIN AUTH MIDDLEWARE - Admin access granted');

    // Attach admin info to request
    (request as any).user = { 
      id: user.id,
      email: user.email,
      username: user.username,
      plan_type: user.plan_type
    };
  } catch (error) {
    console.log('❌ ADMIN AUTH MIDDLEWARE - Error:', error);
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

    // Check if user has superadmin role using singleton Prisma instance
    const prisma = await getPrisma(); // Use singleton getPrisma()
    const adminUser = await prisma.adminUser.findUnique({
      where: { user_id: user.id },
    });

    // Note: No need to disconnect - using singleton instance

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

// Middleware específico para autenticação de administradores
export async function authenticateAdmin(
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

    // Verify JWT token using fastify jwt
    const decoded = request.server.jwt.verify(token) as any;

    if (!decoded) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }

    // Get user from database using singleton Prisma instance
    const prisma = await getPrisma(); // Use singleton getPrisma()
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        plan_type: true,
      },
    });

    if (!user) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    // Check if user is admin
    const adminUser = await prisma.adminUser.findUnique({
      where: { user_id: user.id },
    });

    if (!adminUser) {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }

    // Add user to request object
    (request as any).user = user;

    // Note: No need to disconnect - using singleton instance
  } catch (error) {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message:
        error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}
