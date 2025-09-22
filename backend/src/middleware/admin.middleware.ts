import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export interface AdminUser {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    email: string;
    username: string;
    planType: string;
  };
}

export interface AdminRequest extends FastifyRequest {
  admin?: AdminUser;
}

export async function adminMiddleware(
  request: AdminRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Check if user is authenticated
    if (!request.user) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    // Check if user has admin privileges
    const adminUser = await prisma.adminUser.findUnique({
      where: {
        user_id: request.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            plan_type: true
          }
        }
      }
    });

    if (!adminUser) {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Admin privileges required'
      });
    }

    // Check if admin user is active
    if (!adminUser.user) {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Admin user not found'
      });
    }

    // Attach admin user to request
    request.admin = {
      id: adminUser.id,
      userId: adminUser.user_id,
      role: adminUser.role,
      user: {
        id: adminUser.user.id,
        email: adminUser.user.email,
        username: adminUser.user.username,
        planType: adminUser.user.plan_type
      }
    };

    // Log admin action
    await prisma.auditLog.create({
      data: {
        user_id: request.user.id,
        action: 'admin_access',
        resource: 'admin_panel',
        ip_address: request.ip,
        user_agent: request.headers['user-agent'] || 'Unknown',
        severity: 'info',
        details: {
          endpoint: request.url,
          method: request.method,
          admin_role: adminUser.role
        }
      }
    });

  } catch (error) {
    console.error('Admin middleware error:', error);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify admin privileges'
    });
  }
}

export async function adminRoleMiddleware(
  request: AdminRequest,
  reply: FastifyReply,
  requiredRole: string
): Promise<void> {
  try {
    // First check if user is admin
    await adminMiddleware(request, reply);
    
    // If admin middleware already sent a response, return
    if (reply.sent) {
      return;
    }

    // Check if user has required role
    if (request.admin && request.admin.role !== requiredRole) {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: `Role '${requiredRole}' required`
      });
    }

  } catch (error) {
    console.error('Admin role middleware error:', error);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify admin role'
    });
  }
}

export async function superAdminMiddleware(
  request: AdminRequest,
  reply: FastifyReply
): Promise<void> {
  return adminRoleMiddleware(request, reply, 'super_admin');
}

export async function adminManagerMiddleware(
  request: AdminRequest,
  reply: FastifyReply
): Promise<void> {
  return adminRoleMiddleware(request, reply, 'admin_manager');
}

export async function adminViewerMiddleware(
  request: AdminRequest,
  reply: FastifyReply
): Promise<void> {
  return adminRoleMiddleware(request, reply, 'admin_viewer');
}