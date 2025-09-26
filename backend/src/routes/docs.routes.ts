import { FastifyInstance } from 'fastify';
import { docsController } from '../controllers/docs.controller';
import { adminAuthMiddleware } from '../middleware/auth.middleware';

export async function docsRoutes(fastify: FastifyInstance) {
  // Aplicar autenticação de admin para todas as rotas
  fastify.addHook('preHandler', adminAuthMiddleware);

  // Buscar documentos
  fastify.get('/api/docs/search', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Termo de busca' },
          category: { type: 'string', description: 'Categoria para filtrar' },
          limit: { type: 'string', default: '20', description: 'Limite de resultados' },
          offset: { type: 'string', default: '0', description: 'Offset para paginação' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                files: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      path: { type: 'string' },
                      category: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      size: { type: 'number' },
                      modified: { type: 'string' },
                      relevanceScore: { type: 'number' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    limit: { type: 'number' },
                    offset: { type: 'number' },
                    hasMore: { type: 'boolean' }
                  }
                },
                stats: { type: 'object' },
                searchTerm: { type: 'string' },
                category: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, docsController.searchDocs.bind(docsController));

  // Obter conteúdo de um documento específico
  fastify.get('/api/docs/content/:filePath', {
    schema: {
      params: {
        type: 'object',
        required: ['filePath'],
        properties: {
          filePath: { type: 'string', description: 'Caminho do arquivo' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                content: { type: 'string' },
                rawContent: { type: 'string' },
                filePath: { type: 'string' },
                stats: {
                  type: 'object',
                  properties: {
                    size: { type: 'number' },
                    modified: { type: 'string' },
                    created: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, docsController.getDocContent.bind(docsController));

  // Obter categorias disponíveis
  fastify.get('/api/docs/categories', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  displayName: { type: 'string' },
                  count: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, docsController.getCategories.bind(docsController));

  // Obter estatísticas da documentação
  fastify.get('/api/docs/stats', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalFiles: { type: 'number' },
                totalCategories: { type: 'number' },
                totalSize: { type: 'number' },
                totalLines: { type: 'number' },
                lastUpdated: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, docsController.getStats.bind(docsController));

  // Obter índice completo da documentação
  fastify.get('/api/docs/index', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                categories: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      displayName: { type: 'string' },
                      count: { type: 'number' }
                    }
                  }
                },
                index: { type: 'object' },
                stats: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, docsController.getIndex.bind(docsController));

  // WebSocket para atualizações em tempo real
  fastify.register(async function (fastify) {
    fastify.get('/api/docs/watch', { websocket: true }, (connection, req) => {
      console.log('📚 Cliente conectado ao WebSocket de documentação');
      
      // Enviar estatísticas iniciais
      docsController.getStats(req, {
        send: (data: any) => {
          connection.send(JSON.stringify({
            type: 'stats',
            data: data.data
          }));
        },
        status: () => ({ code: 200 })
      } as any);

      // Monitorar mudanças nos arquivos (simulado - em produção usar fs.watch)
      const interval = setInterval(async () => {
        try {
          const stats = await docsController.getStats(req, {
            send: (data: any) => {
              connection.socket.send(JSON.stringify({
                type: 'stats_update',
                data: data.data,
                timestamp: new Date().toISOString()
              }));
            },
            status: () => ({ code: 200 })
          } as any);
        } catch (error) {
          console.error('Erro ao enviar atualização via WebSocket:', error);
        }
      }, 30000); // Atualizar a cada 30 segundos

      connection.on('close', () => {
        console.log('📚 Cliente desconectado do WebSocket de documentação');
        clearInterval(interval);
      });

      connection.on('error', (error) => {
        console.error('Erro no WebSocket de documentação:', error);
        clearInterval(interval);
      });
    });
  });
}
