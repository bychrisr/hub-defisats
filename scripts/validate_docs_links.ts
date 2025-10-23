#!/usr/bin/env tsx

/**
 * Documentation Links Validator
 * Validates internal links, anchors, and image references in documentation
 */

import * as fs from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface LinkValidationResult {
  file: string;
  validLinks: string[];
  brokenLinks: Array<{
    link: string;
    line: number;
    reason: string;
  }>;
  missingImages: Array<{
    image: string;
    line: number;
  }>;
}

interface ValidationReport {
  timestamp: string;
  total_files: number;
  total_links: number;
  broken_links: number;
  missing_images: number;
  results: LinkValidationResult[];
}

class DocumentationLinkValidator {
  private docsPath: string;
  private report: ValidationReport;

  constructor(docsPath: string) {
    this.docsPath = docsPath;
    this.report = {
      timestamp: new Date().toISOString(),
      total_files: 0,
      total_links: 0,
      broken_links: 0,
      missing_images: 0,
      results: []
    };
  }

  async validate(): Promise<ValidationReport> {
    console.log('🔍 Validando links de documentação...\n');

    const markdownFiles = this.getMarkdownFiles();
    this.report.total_files = markdownFiles.length;

    for (const file of markdownFiles) {
      const result = await this.validateFile(file);
      this.report.results.push(result);
      this.report.total_links += result.validLinks.length + result.brokenLinks.length;
      this.report.broken_links += result.brokenLinks.length;
      this.report.missing_images += result.missingImages.length;
    }

    this.printSummary();
    return this.report;
  }

  private getMarkdownFiles(): string[] {
    const files: string[] = [];
    
    function traverse(dir: string) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(this.docsPath);
    return files;
  }

  private async validateFile(filePath: string): Promise<LinkValidationResult> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const result: LinkValidationResult = {
      file: path.relative(this.docsPath, filePath),
      validLinks: [],
      brokenLinks: [],
      missingImages: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Validar links Markdown
      const markdownLinks = this.extractMarkdownLinks(line);
      for (const link of markdownLinks) {
        if (this.isValidLink(link, filePath)) {
          result.validLinks.push(link);
        } else {
          result.brokenLinks.push({
            link,
            line: lineNumber,
            reason: this.getLinkFailureReason(link, filePath)
          });
        }
      }

      // Validar imagens
      const images = this.extractImages(line);
      for (const image of images) {
        if (!this.isValidImage(image, filePath)) {
          result.missingImages.push({
            image,
            line: lineNumber
          });
        }
      }

      // Validar links HTML
      const htmlLinks = this.extractHtmlLinks(line);
      for (const link of htmlLinks) {
        if (this.isValidLink(link, filePath)) {
          result.validLinks.push(link);
        } else {
          result.brokenLinks.push({
            link,
            line: lineNumber,
            reason: this.getLinkFailureReason(link, filePath)
          });
        }
      }
    }

    return result;
  }

  private extractMarkdownLinks(line: string): string[] {
    const links: string[] = [];
    
    // [text](url) format
    const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = markdownRegex.exec(line)) !== null) {
      links.push(match[2]);
    }

    // [text][ref] format
    const referenceRegex = /\[([^\]]+)\]\[([^\]]+)\]/g;
    while ((match = referenceRegex.exec(line)) !== null) {
      links.push(match[2]);
    }

    return links;
  }

  private extractHtmlLinks(line: string): string[] {
    const links: string[] = [];
    
    // <a href="url">text</a> format
    const htmlRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;
    let match;
    while ((match = htmlRegex.exec(line)) !== null) {
      links.push(match[1]);
    }

    return links;
  }

  private extractImages(line: string): string[] {
    const images: string[] = [];
    
    // ![alt](url) format
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = imageRegex.exec(line)) !== null) {
      images.push(match[2]);
    }

    // <img src="url"> format
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    while ((match = imgRegex.exec(line)) !== null) {
      images.push(match[1]);
    }

    return images;
  }

  private isValidLink(link: string, currentFile: string): boolean {
    // Links externos são sempre válidos
    if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('mailto:')) {
      return true;
    }

    // Links para âncoras na mesma página
    if (link.startsWith('#')) {
      return this.isValidAnchor(link, currentFile);
    }

    // Links relativos
    if (link.startsWith('./') || link.startsWith('../') || (!link.startsWith('/') && !link.startsWith('#'))) {
      return this.isValidRelativeLink(link, currentFile);
    }

    // Links absolutos (começando com /)
    if (link.startsWith('/')) {
      return this.isValidAbsoluteLink(link);
    }

    return false;
  }

  private isValidAnchor(anchor: string, currentFile: string): boolean {
    const fullPath = path.isAbsolute(currentFile) ? currentFile : path.join(this.docsPath, currentFile);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const anchorId = anchor.substring(1).toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Procurar por cabeçalhos que correspondam ao âncora
    const headerRegex = new RegExp(`^#{1,6}\\s+(.+)$`, 'gm');
    let match;
    while ((match = headerRegex.exec(content)) !== null) {
      const headerId = match[1].toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (headerId === anchorId) {
        return true;
      }
    }

    return false;
  }

  private isValidRelativeLink(link: string, currentFile: string): boolean {
    const currentDir = path.dirname(path.join(this.docsPath, currentFile));
    const targetPath = path.resolve(currentDir, link);
    
    // Verificar se arquivo existe
    if (fs.existsSync(targetPath)) {
      return true;
    }

    // Verificar se é um link para âncora em outro arquivo
    const [filePart, anchorPart] = link.split('#');
    if (anchorPart) {
      const filePath = path.resolve(currentDir, filePart);
      if (fs.existsSync(filePath)) {
        return this.isValidAnchor('#' + anchorPart, path.relative(this.docsPath, filePath));
      }
    }

    return false;
  }

  private isValidAbsoluteLink(link: string): boolean {
    const targetPath = path.join(this.docsPath, link);
    return fs.existsSync(targetPath);
  }

  private isValidImage(image: string, currentFile: string): boolean {
    // Imagens externas são sempre válidas
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return true;
    }

    const currentDir = path.dirname(path.join(this.docsPath, currentFile));
    const imagePath = path.resolve(currentDir, image);
    
    return fs.existsSync(imagePath);
  }

  private getLinkFailureReason(link: string, currentFile: string): string {
    if (link.startsWith('#')) {
      return 'Âncora não encontrada';
    }

    const currentDir = path.dirname(path.join(this.docsPath, currentFile));
    const targetPath = path.resolve(currentDir, link);
    
    if (!fs.existsSync(targetPath)) {
      return 'Arquivo não encontrado';
    }

    return 'Link inválido';
  }

  private printSummary(): void {
    console.log('\n📊 Resumo da Validação:');
    console.log(`   📄 Arquivos verificados: ${this.report.total_files}`);
    console.log(`   🔗 Total de links: ${this.report.total_links}`);
    console.log(`   ❌ Links quebrados: ${this.report.broken_links}`);
    console.log(`   🖼️  Imagens ausentes: ${this.report.missing_images}`);

    if (this.report.broken_links > 0) {
      console.log('\n⚠️  Links quebrados encontrados:');
      for (const result of this.report.results) {
        if (result.brokenLinks.length > 0) {
          console.log(`   📄 ${result.file}:`);
          for (const broken of result.brokenLinks) {
            console.log(`      ❌ Linha ${broken.line}: ${broken.link} (${broken.reason})`);
          }
        }
      }
    }

    if (this.report.missing_images > 0) {
      console.log('\n⚠️  Imagens ausentes encontradas:');
      for (const result of this.report.results) {
        if (result.missingImages.length > 0) {
          console.log(`   📄 ${result.file}:`);
          for (const missing of result.missingImages) {
            console.log(`      🖼️  Linha ${missing.line}: ${missing.image}`);
          }
        }
      }
    }
  }
}

// CLI Interface
const argv = yargs(hideBin(process.argv))
  .option('docs', {
    type: 'string',
    default: './docs',
    description: 'Diretório de documentação para validar'
  })
  .option('output', {
    type: 'string',
    description: 'Arquivo de saída para o relatório JSON'
  })
  .help()
  .argv;

// Executar validação
async function main() {
  const validator = new DocumentationLinkValidator(argv.docs);
  const report = await validator.validate();

  if (argv.output) {
    fs.writeFileSync(argv.output, JSON.stringify(report, null, 2));
    console.log(`\n📄 Relatório salvo em: ${argv.output}`);
  }

  // Exit code baseado no resultado
  if (report.broken_links > 0 || report.missing_images > 0) {
    process.exit(1);
  }
}

// Executar se for o módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
