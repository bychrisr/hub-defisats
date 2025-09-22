import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

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

    // Find active redirect for the given path
    const redirect = await prisma.routeRedirect.findFirst({
      where: {
        from_path: path,
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!redirect) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'No redirect found for this path'
      });
    }

    // Return redirect information
    return reply.send({
      from_path: redirect.from_path,
      to_path: redirect.to_path,
      redirect_type: redirect.redirect_type,
      status_code: redirect.redirect_type === 'permanent' ? 301 : 302
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
    const redirects = await prisma.routeRedirect.findMany({
      where: {
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      },
      select: {
        from_path: true,
        to_path: true,
        redirect_type: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return reply.send({
      redirects,
      count: redirects.length
    });
  } catch (error) {
    request.log.error('Error getting all active redirects:', error);
    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get active redirects'
    });
  }
}
