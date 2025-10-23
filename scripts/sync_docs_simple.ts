#!/usr/bin/env tsx

/**
 * Simple Documentation Sync Script
 * Consolidates .md files from root into /docs directory
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileMapping {
  source: string;
  destination: string;
  action: 'merge' | 'move' | 'delete';
  decision: string;
}

class SimpleDocumentationSync {
  private rootPath: string;
  private docsPath: string;
  private dryRun: boolean;
  private reallyDelete: boolean;

  constructor(rootPath: string, docsPath: string, dryRun: boolean = false, reallyDelete: boolean = false) {
    this.rootPath = rootPath;
    this.docsPath = docsPath;
    this.dryRun = dryRun;
    this.reallyDelete = reallyDelete;
  }

  async run(): Promise<void> {
    console.log('🚀 Iniciando sincronização de documentação...\n');

    try {
      // 1. Indexar arquivos .md na raiz
      const rootFiles = this.getRootMarkdownFiles();
      console.log(`📁 Encontrados ${rootFiles.length} arquivos .md na raiz`);

      // 2. Processar cada arquivo
      for (const file of rootFiles) {
        await this.processFile(file);
      }

      console.log('\n✅ Sincronização concluída com sucesso!');

    } catch (error) {
      console.error('❌ Erro durante sincronização:', error);
      process.exit(1);
    }
  }

  private getRootMarkdownFiles(): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(this.rootPath);
    
    for (const item of items) {
      if (item.endsWith('.md') && item !== 'README.md') {
        files.push(path.join(this.rootPath, item));
      }
    }
    
    return files;
  }

  private async processFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    console.log(`\n📄 Processando: ${fileName}`);

    try {
      // Determinar ação baseada no nome do arquivo
      const mapping = this.determineFileMapping(fileName, filePath);
      
      if (mapping.action === 'delete') {
        await this.deleteFile(filePath, mapping);
      } else if (mapping.action === 'move') {
        await this.moveFile(filePath, mapping);
      } else if (mapping.action === 'merge') {
        await this.mergeFile(filePath, mapping);
      }

    } catch (error) {
      console.error(`❌ Erro processando ${fileName}:`, error);
    }
  }

  private determineFileMapping(fileName: string, filePath: string): FileMapping {
    // Arquivos para exclusão
    if (['plan.md', 'fix-testnet-toggle-error.plan.md', 'id.md'].includes(fileName)) {
      return {
        source: fileName,
        destination: '',
        action: 'delete',
        decision: 'Arquivo de plano implementado ou contexto histórico não essencial'
      };
    }

    // Relatórios temporais
    if (fileName.startsWith('RELATORIO_') || fileName.startsWith('ANALISE_') || fileName.startsWith('TIMESTAMP_')) {
      const reportName = this.generateReportName(fileName);
      return {
        source: fileName,
        destination: path.join(this.docsPath, 'reports', reportName),
        action: 'move',
        decision: 'Relatório temporal movido para /docs/reports/'
      };
    }

    // CHANGELOG.md
    if (fileName === 'CHANGELOG.md') {
      return {
        source: fileName,
        destination: path.join(this.docsPath, 'project', 'CHANGELOG.md'),
        action: 'move',
        decision: 'Changelog movido para /docs/project/'
      };
    }

    // Documentos para merge
    const mergeMapping = this.determineMergeMapping(fileName, filePath);
    if (mergeMapping) {
      return mergeMapping;
    }

    // Fallback: mover para reports
    const reportName = this.generateReportName(fileName);
    return {
      source: fileName,
      destination: path.join(this.docsPath, 'reports', reportName),
      action: 'move',
      decision: 'Arquivo movido para reports por falta de mapeamento específico'
    };
  }

  private determineMergeMapping(fileName: string, filePath: string): FileMapping | null {
    // DECISIONS.md -> /docs/architecture/decisions/architecture-decisions.md
    if (fileName === 'DECISIONS.md') {
      return {
        source: fileName,
        destination: path.join(this.docsPath, 'architecture', 'decisions', 'architecture-decisions.md'),
        action: 'merge',
        decision: 'Mesclar com documentação de decisões arquiteturais'
      };
    }

    // DOCUMENTATION_STANDARDS.md -> /docs/workflow/documentation-standards.md
    if (fileName === 'DOCUMENTATION_STANDARDS.md') {
      return {
        source: fileName,
        destination: path.join(this.docsPath, 'workflow', 'documentation-standards.md'),
        action: 'merge',
        decision: 'Mesclar com padrões de documentação existentes'
      };
    }

    // MAPA_ENTENDIMENTO_SISTEMA_AXISOR.md -> /docs/architecture/system-architecture.md
    if (fileName === 'MAPA_ENTENDIMENTO_SISTEMA_AXISOR.md') {
      return {
        source: fileName,
        destination: path.join(this.docsPath, 'architecture', 'system-architecture.md'),
        action: 'merge',
        decision: 'Mesclar com arquitetura do sistema'
      };
    }

    // RESUMO_TECNICO_ARQUITETURA_AXISOR.md -> /docs/architecture/system-overview/technology-stack.md
    if (fileName === 'RESUMO_TECNICO_ARQUITETURA_AXISOR.md') {
      return {
        source: fileName,
        destination: path.join(this.docsPath, 'architecture', 'system-overview', 'technology-stack.md'),
        action: 'merge',
        decision: 'Mesclar com stack tecnológico'
      };
    }

    // GUIA-MARGIN-GUARD-COMPLETO.md -> /docs/automations/margin-guard/
    if (fileName === 'GUIA-MARGIN-GUARD-COMPLETO.md') {
      return {
        source: fileName,
        destination: path.join(this.docsPath, 'automations', 'margin-guard', 'configuration.md'),
        action: 'merge',
        decision: 'Mesclar com configuração do Margin Guard'
      };
    }

    // DEBUG-CREDENTIALS-GUIDE.md -> /docs/troubleshooting/authentication-issues.md
    if (fileName === 'DEBUG-CREDENTIALS-GUIDE.md') {
      return {
        source: fileName,
        destination: path.join(this.docsPath, 'troubleshooting', 'authentication-issues.md'),
        action: 'merge',
        decision: 'Mesclar com troubleshooting de autenticação'
      };
    }

    return null;
  }

  private generateReportName(fileName: string): string {
    const date = new Date().toISOString().split('T')[0];
    const baseName = fileName.replace('.md', '').toLowerCase();
    return `${date}_${baseName}-report.md`;
  }

  private async deleteFile(filePath: string, mapping: FileMapping): Promise<void> {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Deletaria: ${filePath}`);
      return;
    }

    if (this.reallyDelete) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deletado: ${path.basename(filePath)}`);
    } else {
      console.log(`⚠️  Arquivo marcado para exclusão: ${path.basename(filePath)} (use --really-delete para confirmar)`);
    }
  }

  private async moveFile(filePath: string, mapping: FileMapping): Promise<void> {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Moveria: ${filePath} -> ${mapping.destination}`);
      return;
    }

    // Criar diretório de destino se não existir
    const destDir = path.dirname(mapping.destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Ler conteúdo e aplicar frontmatter
    const content = fs.readFileSync(filePath, 'utf-8');
    const updatedContent = this.addFrontmatter(content, mapping);

    // Escrever arquivo no destino
    fs.writeFileSync(mapping.destination, updatedContent);
    
    // Deletar arquivo original
    if (this.reallyDelete) {
      fs.unlinkSync(filePath);
    }

    console.log(`📦 Movido: ${path.basename(filePath)} -> ${mapping.destination}`);
  }

  private async mergeFile(filePath: string, mapping: FileMapping): Promise<void> {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Mesclaria: ${filePath} -> ${mapping.destination}`);
      return;
    }

    // Verificar se arquivo de destino existe
    if (fs.existsSync(mapping.destination)) {
      // Ler conteúdo existente
      const existingContent = fs.readFileSync(mapping.destination, 'utf-8');
      const newContent = fs.readFileSync(filePath, 'utf-8');
      
      // Mesclar conteúdo (implementação simplificada)
      const mergedContent = this.mergeContent(existingContent, newContent);
      
      // Aplicar frontmatter
      const updatedContent = this.addFrontmatter(mergedContent, mapping);
      
      // Escrever arquivo mesclado
      fs.writeFileSync(mapping.destination, updatedContent);
      
      console.log(`🔀 Mesclado: ${path.basename(filePath)} -> ${mapping.destination}`);
    } else {
      // Arquivo de destino não existe, mover diretamente
      await this.moveFile(filePath, mapping);
    }

    // Deletar arquivo original
    if (this.reallyDelete) {
      fs.unlinkSync(filePath);
    }
  }

  private mergeContent(existing: string, newContent: string): string {
    // Implementação simplificada de merge
    // Em uma implementação real, seria mais sofisticada
    return `${existing}\n\n---\n\n## Conteúdo Adicional\n\n${newContent}`;
  }

  private addFrontmatter(content: string, mapping: FileMapping): string {
    const frontmatter = `---
title: "${this.extractTitle(content)}"
version: "1.0.0"
created: "${new Date().toISOString().split('T')[0]}"
updated: "${new Date().toISOString().split('T')[0]}"
author: "Documentation Sync Agent"
status: "active"
last_synced: "${new Date().toISOString()}"
source_of_truth: "/docs"
---

`;

    // Verificar se já tem frontmatter
    if (content.startsWith('---')) {
      return content; // Já tem frontmatter
    }

    return frontmatter + content;
  }

  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : 'Documento';
  }
}

// Executar sincronização
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const reallyDelete = process.argv.includes('--really-delete');
  
  const sync = new SimpleDocumentationSync('.', './docs', dryRun, reallyDelete);
  await sync.run();
}

// Executar se for o módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
