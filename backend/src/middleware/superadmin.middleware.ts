import { FastifyRequest, FastifyReply } from 'fastify';

export async function superAdminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verificar se o usuário está autenticado
    if (!request.user) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Verificar se o usuário é superadmin
    // Por enquanto, vamos assumir que qualquer usuário autenticado pode acessar
    // Em produção, você deve verificar se o usuário tem o papel de superadmin
    const user = request.user as any;
    
    // Verificar se o usuário tem permissão de admin
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Superadmin access required',
      });
    }

    // Usuário autorizado, continuar
    return;
  } catch (error) {
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error verifying superadmin access',
    });
  }
}
