import { FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'fs/promises';
import * as path from 'path';
import { marked } from 'marked';

export class DocsController {
  private docsPath: string;
  private systemPath: string;

  constructor() {
    // Caminhos para os diretórios de documentação
    this.docsPath = path.join(process.cwd(), '.system', 'docs');
    this.systemPath = path.join(process.cwd(), '.system');
  }

  /**
   * Buscar documentos por termo
   */
  async searchDocs(request: FastifyRequest<{
    Querystring: {
      q?: string;
      category?: string;
      limit?: string;
      offset?: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { q = '', category, limit = '20', offset = '0' } = request.query;
      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      // Buscar todos os arquivos .md
      const allFiles = await this.getAllMarkdownFiles();
      
      let filteredFiles = allFiles;

      // Filtrar por categoria se especificada
      if (category) {
        filteredFiles = allFiles.filter(file => 
          file.category === category || file.category === 'root'
        );
      }

      // Buscar por termo se especificado
      if (q.trim()) {
        const searchTerm = q.toLowerCase();
        const searchResults = [];

        for (const file of filteredFiles) {
          try {
            const content = await fs.readFile(file.fullPath, 'utf-8');
            const title = this.extractTitle(content);
            const description = this.extractDescription(content);
            
            // Buscar no título, descrição e conteúdo
            const titleMatch = title.toLowerCase().includes(searchTerm);
            const descMatch = description.toLowerCase().includes(searchTerm);
            const contentMatch = content.toLowerCase().includes(searchTerm);

            if (titleMatch || descMatch || contentMatch) {
              searchResults.push({
                ...file,
                title,
                description,
                relevanceScore: this.calculateRelevanceScore(
                  titleMatch, descMatch, contentMatch, searchTerm, title, content
                )
              });
            }
          } catch (error) {
            console.warn(`Erro ao ler arquivo ${file.fullPath}:`, error);
          }
        }

        // Ordenar por relevância
        searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        filteredFiles = searchResults;
      } else {
        // Se não há busca, adicionar título e descrição
        for (const file of filteredFiles) {
          try {
            const content = await fs.readFile(file.fullPath, 'utf-8');
            file.title = this.extractTitle(content);
            file.description = this.extractDescription(content);
          } catch (error) {
            console.warn(`Erro ao ler arquivo ${file.fullPath}:`, error);
            file.title = file.name;
            file.description = '';
          }
        }
      }

      // Paginação
      const total = filteredFiles.length;
      const paginatedFiles = filteredFiles.slice(offsetNum, offsetNum + limitNum);

      // Adicionar estatísticas
      const stats = await this.getDocsStats();

      return reply.send({
        success: true,
        data: {
          files: paginatedFiles,
          pagination: {
            total,
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < total
          },
          stats,
          searchTerm: q,
          category: category || 'all'
        }
      });

    } catch (error) {
      console.error('Erro na busca de documentos:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível realizar a busca'
      });
    }
  }

  /**
   * Obter conteúdo de um documento específico
   */
  async getDocContent(request: FastifyRequest<{
    Params: { filePath: string }
  }>, reply: FastifyReply) {
    try {
      const { filePath } = request.params;
      
      // Decodificar o caminho
      const decodedPath = decodeURIComponent(filePath);
      
      // Construir caminho completo
      const fullPath = path.join(this.docsPath, decodedPath);
      
      // Verificar se o arquivo existe e está dentro do diretório docs
      if (!fullPath.startsWith(this.docsPath) && !fullPath.startsWith(this.systemPath)) {
        return reply.status(403).send({
          success: false,
          error: 'Acesso negado',
          message: 'Caminho não permitido'
        });
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      const title = this.extractTitle(content);
      const description = this.extractDescription(content);
      
      // Converter Markdown para HTML
      const htmlContent = marked(content);
      
      // Obter estatísticas do arquivo
      const stats = await fs.stat(fullPath);
      
      return reply.send({
        success: true,
        data: {
          title,
          description,
          content: htmlContent,
          rawContent: content,
          filePath: decodedPath,
          stats: {
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime
          }
        }
      });

    } catch (error) {
      console.error('Erro ao obter conteúdo do documento:', error);
      return reply.status(404).send({
        success: false,
        error: 'Documento não encontrado',
        message: 'O arquivo solicitado não existe ou não pode ser lido'
      });
    }
  }

  /**
   * Obter categorias disponíveis
   */
  async getCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await this.getAvailableCategories();
      
      return reply.send({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Erro ao obter categorias:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível obter as categorias'
      });
    }
  }

  /**
   * Obter estatísticas gerais da documentação
   */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.getDocsStats();
      
      return reply.send({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível obter as estatísticas'
      });
    }
  }

  /**
   * Obter índice completo da documentação
   */
  async getIndex(request: FastifyRequest, reply: FastifyReply) {
    try {
      const allFiles = await this.getAllMarkdownFiles();
      const categories = await this.getAvailableCategories();
      
      // Organizar por categoria
      const indexByCategory: Record<string, any[]> = {};
      
      for (const file of allFiles) {
        if (!indexByCategory[file.category]) {
          indexByCategory[file.category] = [];
        }
        
        try {
          const content = await fs.readFile(file.fullPath, 'utf-8');
          indexByCategory[file.category].push({
            ...file,
            title: this.extractTitle(content),
            description: this.extractDescription(content)
          });
        } catch (error) {
          indexByCategory[file.category].push({
            ...file,
            title: file.name,
            description: ''
          });
        }
      }

      return reply.send({
        success: true,
        data: {
          categories,
          index: indexByCategory,
          stats: await this.getDocsStats()
        }
      });

    } catch (error) {
      console.error('Erro ao obter índice:', error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível obter o índice'
      });
    }
  }

  // Métodos auxiliares privados

  private async getAllMarkdownFiles(): Promise<any[]> {
    const files: any[] = [];
    
    // Buscar arquivos no diretório docs
    await this.scanDirectory(this.docsPath, files, 'docs');
    
    // Buscar arquivos no diretório system (raiz)
    await this.scanDirectory(this.systemPath, files, 'system');
    
    return files;
  }

  private async scanDirectory(dirPath: string, files: any[], baseCategory: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursivamente escanear subdiretórios
          await this.scanDirectory(fullPath, files, entry.name);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const relativePath = path.relative(
            baseCategory === 'system' ? this.systemPath : this.docsPath, 
            fullPath
          );
          
          files.push({
            name: entry.name,
            path: relativePath,
            fullPath,
            category: baseCategory === 'system' ? 'root' : path.dirname(relativePath) || 'root',
            size: (await fs.stat(fullPath)).size,
            modified: (await fs.stat(fullPath)).mtime
          });
        }
      }
    } catch (error) {
      console.warn(`Erro ao escanear diretório ${dirPath}:`, error);
    }
  }

  private async getAvailableCategories(): Promise<any[]> {
    const categories = new Set<string>();
    const allFiles = await this.getAllMarkdownFiles();
    
    for (const file of allFiles) {
      categories.add(file.category);
    }
    
    return Array.from(categories).map(category => ({
      name: category,
      displayName: this.getCategoryDisplayName(category),
      count: allFiles.filter(f => f.category === category).length
    }));
  }

  private getCategoryDisplayName(category: string): string {
    const displayNames: Record<string, string> = {
      'root': '📋 Documentos Principais',
      'admin': '🛠️ Administração',
      'api': '🔌 API',
      'architecture': '🏛️ Arquitetura',
      'deployment': '🚀 Deploy',
      'development': '💻 Desenvolvimento',
      'features': '✨ Features',
      'infrastructure': '🏗️ Infraestrutura',
      'ln_markets': '⚡ LN Markets',
      'migrations': '🔄 Migrações',
      'monitoring': '📊 Monitoramento',
      'performance': '⚡ Performance',
      'security': '🔒 Segurança',
      'troubleshooting': '🔧 Troubleshooting',
      'ui': '🎨 Interface'
    };
    
    return displayNames[category] || `📁 ${category}`;
  }

  private async getDocsStats(): Promise<any> {
    const allFiles = await this.getAllMarkdownFiles();
    const categories = await this.getAvailableCategories();
    
    let totalSize = 0;
    let totalLines = 0;
    
    for (const file of allFiles) {
      totalSize += file.size;
      try {
        const content = await fs.readFile(file.fullPath, 'utf-8');
        totalLines += content.split('\n').length;
      } catch (error) {
        // Ignorar erros de leitura
      }
    }
    
    return {
      totalFiles: allFiles.length,
      totalCategories: categories.length,
      totalSize,
      totalLines,
      lastUpdated: new Date().toISOString()
    };
  }

  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  private extractDescription(content: string): string {
    // Procurar por linha que começa com > ou primeira linha após título
    const lines = content.split('\n');
    let foundTitle = false;
    
    for (const line of lines) {
      if (line.startsWith('# ')) {
        foundTitle = true;
        continue;
      }
      
      if (foundTitle && line.trim()) {
        if (line.startsWith('> ')) {
          return line.substring(2).trim();
        } else if (line.length > 10 && !line.startsWith('#')) {
          return line.trim();
        }
      }
    }
    
    return '';
  }

  private calculateRelevanceScore(
    titleMatch: boolean,
    descMatch: boolean,
    contentMatch: boolean,
    searchTerm: string,
    title: string,
    content: string
  ): number {
    let score = 0;
    
    // Título tem peso maior
    if (titleMatch) {
      score += 100;
      // Bonus se o termo está no início do título
      if (title.toLowerCase().startsWith(searchTerm)) {
        score += 50;
      }
    }
    
    // Descrição tem peso médio
    if (descMatch) {
      score += 50;
    }
    
    // Conteúdo tem peso menor
    if (contentMatch) {
      score += 10;
      // Contar ocorrências no conteúdo
      const occurrences = (content.toLowerCase().match(new RegExp(searchTerm, 'g')) || []).length;
      score += Math.min(occurrences * 5, 30);
    }
    
    return score;
  }
}

export const docsController = new DocsController();
