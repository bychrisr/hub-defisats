import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface DocFile {
  name: string;
  path: string;
  category: string;
  title: string;
  description: string;
  size: number;
  modified: string;
  relevanceScore?: number;
}

export interface DocStats {
  totalFiles: number;
  totalCategories: number;
  totalSize: number;
  totalLines: number;
  lastUpdated: string;
}

export interface Category {
  name: string;
  displayName: string;
  count: number;
}

export interface SearchParams {
  q?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  files: DocFile[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats: DocStats;
  searchTerm: string;
  category: string;
}

export interface DocContent {
  title: string;
  description: string;
  content: string;
  rawContent: string;
  filePath: string;
  stats: {
    size: number;
    modified: string;
    created: string;
  };
}

export function useDocumentation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDocs = useCallback(async (params: SearchParams = {}): Promise<SearchResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (params.q) searchParams.append('q', params.q);
      if (params.category) searchParams.append('category', params.category);
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());

      const response = await api.get(`/docs/search?${searchParams}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro na busca');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro na busca de documentos:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDocContent = useCallback(async (filePath: string): Promise<DocContent | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(`/docs/content/${encodeURIComponent(filePath)}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao carregar conteúdo');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar conteúdo do documento:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCategories = useCallback(async (): Promise<Category[] | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get('/docs/categories');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao carregar categorias');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar categorias:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStats = useCallback(async (): Promise<DocStats | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get('/docs/stats');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao carregar estatísticas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar estatísticas:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getIndex = useCallback(async (): Promise<any | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get('/docs/index');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao carregar índice');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar índice:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    searchDocs,
    getDocContent,
    getCategories,
    getStats,
    getIndex
  };
}

export function useDocumentationWebSocket() {
  const [stats, setStats] = useState<DocStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectInterval: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        const token = localStorage.getItem('access_token');
        const wsUrl = `${import.meta.env.VITE_API_URL?.replace('http', 'ws')}/docs/watch?token=${token}`;
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('📚 WebSocket de documentação conectado');
          setIsConnected(true);
          setError(null);
          
          // Limpar intervalo de reconexão
          if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'stats' || data.type === 'stats_update') {
              setStats(data.data);
            }
          } catch (err) {
            console.error('Erro ao processar mensagem WebSocket:', err);
          }
        };
        
        ws.onclose = () => {
          console.log('📚 WebSocket de documentação desconectado');
          setIsConnected(false);
          
          // Tentar reconectar após 5 segundos
          if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
              connect();
            }, 5000);
          }
        };
        
        ws.onerror = (error) => {
          console.error('Erro no WebSocket de documentação:', error);
          setError('Erro de conexão WebSocket');
        };
        
      } catch (err) {
        console.error('Erro ao conectar WebSocket:', err);
        setError('Erro ao conectar WebSocket');
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
    };
  }, []);

  return {
    stats,
    isConnected,
    error
  };
}
