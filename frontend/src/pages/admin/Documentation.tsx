import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  FileText, 
  Folder, 
  FolderOpen,
  Calendar, 
  Clock, 
  RefreshCw,
  Eye,
  Download,
  Filter,
  X,
  BookOpen,
  TrendingUp,
  Users,
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { DocumentationTest } from '@/components/admin/DocumentationTest';

interface DocFile {
  name: string;
  path: string;
  category: string;
  title: string;
  description: string;
  size: number;
  modified: string;
  relevanceScore?: number;
}

interface DocStats {
  totalFiles: number;
  totalCategories: number;
  totalSize: number;
  totalLines: number;
  lastUpdated: string;
}

interface Category {
  name: string;
  displayName: string;
  count: number;
}

export default function Documentation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [files, setFiles] = useState<DocFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<DocStats | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });
  const [showStats, setShowStats] = useState(true);
  const [realtimeStats, setRealtimeStats] = useState<DocStats | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryFiles, setCategoryFiles] = useState<Record<string, DocFile[]>>({});
  
  const { toast } = useToast();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const wsRef = useRef<WebSocket | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
    // Temporariamente desabilitar WebSocket para debug
    // connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Buscar quando termo ou categoria mudar
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchDocs();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedCategory]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Debug: Verificar token
      const token = localStorage.getItem('access_token');
      console.log('🔍 DOCUMENTATION - Token exists:', !!token);
      console.log('🔍 DOCUMENTATION - Token preview:', token ? '[REDACTED]' : 'null');
      
      const [categoriesRes, statsRes] = await Promise.all([
        api.get('/api/docs/categories'),
        api.get('/api/docs/stats')
      ]);

      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
        setRealtimeStats(statsRes.data.data);
      }

      // Carregar todos os documentos inicialmente
      await searchDocs();
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a documentação',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchDocs = async (offset = 0) => {
    try {
      setIsLoading(true);
      
      console.log('🔍 DOCUMENTATION - Searching with:', {
        searchTerm,
        selectedCategory,
        offset
      });
      
      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString()
      });

      if (searchTerm.trim()) {
        params.append('q', searchTerm.trim());
      }

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await api.get(`/api/docs/search?${params}`);
      
      console.log('🔍 DOCUMENTATION - API Response:', {
        success: response.data.success,
        filesCount: response.data.data?.files?.length || 0,
        category: selectedCategory
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        if (offset === 0) {
          setFiles(data.files);
          console.log('🔍 DOCUMENTATION - Files set:', data.files.length, 'Category:', selectedCategory);
          console.log('🔍 DOCUMENTATION - Files data:', data.files.map(f => ({ name: f.name, category: f.category })));
        } else {
          setFiles(prev => [...prev, ...data.files]);
        }
        
        setPagination(data.pagination);
      }
      
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível realizar a busca',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFileContent = async (file: DocFile) => {
    try {
      setIsLoadingContent(true);
      setSelectedFile(file);
      
      const response = await api.get(`/api/docs/content/${encodeURIComponent(file.path)}`);
      
      if (response.data.success) {
        setFileContent(response.data.data.content);
      }
      
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o conteúdo do arquivo',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingContent(false);
    }
  };

  const loadCategoryFiles = async (categoryName: string) => {
    try {
      console.log('🔍 DOCUMENTATION - Loading files for category:', categoryName);
      
      const params = new URLSearchParams({
        limit: '100', // Carregar mais arquivos por categoria
        category: categoryName
      });

      const response = await api.get(`/api/docs/search?${params}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setCategoryFiles(prev => ({
          ...prev,
          [categoryName]: data.files
        }));
        console.log('🔍 DOCUMENTATION - Files loaded for category:', categoryName, data.files.length);
      }
      
    } catch (error) {
      console.error('Erro ao carregar arquivos da categoria:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os arquivos da categoria',
        variant: 'destructive'
      });
    }
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
      // Carregar arquivos da categoria se ainda não foram carregados
      if (!categoryFiles[categoryName]) {
        loadCategoryFiles(categoryName);
      }
    }
    setExpandedCategories(newExpanded);
  };

  const connectWebSocket = () => {
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const wsUrl = `${baseUrl.replace('http', 'ws')}/api/docs/watch?token=${token}`;
      
      console.log('🔍 DOCUMENTATION - WebSocket URL:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'stats_update') {
            setRealtimeStats(data.data);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
      };
      
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'root': <FileText className="h-4 w-4" />,
      'admin': <Users className="h-4 w-4" />,
      'api': <Database className="h-4 w-4" />,
      'architecture': <TrendingUp className="h-4 w-4" />,
      'deployment': <RefreshCw className="h-4 w-4" />,
      'development': <BookOpen className="h-4 w-4" />,
      'features': <FileText className="h-4 w-4" />,
      'infrastructure': <Database className="h-4 w-4" />,
      'ln_markets': <TrendingUp className="h-4 w-4" />,
      'migrations': <RefreshCw className="h-4 w-4" />,
      'monitoring': <Eye className="h-4 w-4" />,
      'performance': <TrendingUp className="h-4 w-4" />,
      'security': <Users className="h-4 w-4" />,
      'troubleshooting': <RefreshCw className="h-4 w-4" />,
      'ui': <Eye className="h-4 w-4" />
    };
    
    return icons[category] || <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📚 Documentação</h1>
          <p className="text-muted-foreground">
            Busque e visualize a documentação técnica do projeto em tempo real
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTest(!showTest)}
          >
            {showTest ? 'Ocultar' : 'Mostrar'} Teste
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Ocultar' : 'Mostrar'} Estatísticas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInitialData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Componente de Teste */}
      {showTest && <DocumentationTest />}

      {/* Estatísticas */}
      {showStats && (stats || realtimeStats) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total de Arquivos</p>
                  <p className="text-2xl font-bold">
                    {(realtimeStats || stats)?.totalFiles || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Categorias</p>
                  <p className="text-2xl font-bold">
                    {(realtimeStats || stats)?.totalCategories || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Tamanho Total</p>
                  <p className="text-2xl font-bold">
                    {formatFileSize((realtimeStats || stats)?.totalSize || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Última Atualização</p>
                  <p className="text-sm font-bold">
                    {formatDate((realtimeStats || stats)?.lastUpdated || '')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Busca */}
        <div className="lg:col-span-1 space-y-4">
          {/* Busca */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Buscar Documentação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Sistema de Acordeão por Categoria */}
              <div>
                <label className="text-sm font-medium mb-2 block">Categorias</label>
                <div className="space-y-1">
                  {categories.map((category) => {
                    const isExpanded = expandedCategories.has(category.name);
                    const categoryFilesList = categoryFiles[category.name] || [];
                    
                    return (
                      <div key={category.name} className="border rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategory(category.name)}
                          className="w-full justify-between p-3 h-auto"
                        >
                          <div className="flex items-center space-x-2">
                            {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                            <span className="font-medium">{category.displayName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {category.count}
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {isExpanded && (
                          <div className="border-t bg-muted/30">
                            <ScrollArea className="h-64">
                              <div className="p-2 space-y-1">
                                {categoryFilesList.map((file, index) => (
                                  <div
                                    key={`${file.path}-${index}`}
                                    className={`p-2 rounded cursor-pointer transition-colors text-sm ${
                                      selectedFile?.path === file.path
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                    }`}
                                    onClick={() => loadFileContent(file)}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <FileText className="h-3 w-3 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                          {file.title || file.name}
                                        </p>
                                        {file.description && (
                                          <p className="text-xs opacity-70 truncate">
                                            {file.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                
                                {categoryFilesList.length === 0 && (
                                  <div className="text-center py-4 text-muted-foreground text-sm">
                                    <FileText className="h-6 w-6 mx-auto mb-2" />
                                    <p>Carregando arquivos...</p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Visualizador de Conteúdo */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>
                    {selectedFile ? selectedFile.title || selectedFile.name : 'Selecione um documento'}
                  </span>
                </div>
                {selectedFile && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {selectedFile.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(selectedFile.modified)}
                    </span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Carregando conteúdo...</span>
                </div>
              ) : fileContent ? (
                <ScrollArea className="h-96">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: fileContent }}
                  />
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum documento selecionado</h3>
                  <p>Selecione um documento da lista ao lado para visualizar seu conteúdo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
