import { FastifyRequest, FastifyReply } from 'fastify';

interface RedirectQuery {
  path: string;
}

export async function checkRedirect(request: FastifyRequest<{ Querystring: RedirectQuery }>, reply: FastifyReply) {
  try {
    const { path } = request.query;

    if (!path) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'Path parameter is required'
      });
    }

    // Sistema de redirecionamento desativado - sempre retorna "não encontrado"
    return reply.status(200).send({
      found: false,
      message: 'Redirect system is disabled'
    });
  } catch (error) {
    request.log.error('Error checking redirect:', error);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to check redirect'
    });
  }
}

export async function getAllActiveRedirects(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Sistema de redirecionamento desativado - retorna lista vazia
    return reply.send({
      redirects: [],
      count: 0
    });
  } catch (error) {
    request.log.error('Error getting all active redirects:', error);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get active redirects'
    });
  }
}
