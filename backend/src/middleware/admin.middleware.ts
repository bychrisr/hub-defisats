import { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Check if user is authenticated (should be called after authMiddleware)
    const user = (request as any).user;
    
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Check if user is admin
    if (!user.is_admin) {
      return reply.status(403).send({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }

    // User is admin, continue
    return;
  } catch (error) {
    console.error('Error in admin middleware:', error);
    return reply.status(500).send({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify admin access',
    });
  }
}
