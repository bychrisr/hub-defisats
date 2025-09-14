#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Função para corrigir problemas de variáveis não utilizadas
function fixUnusedVariables(content) {
  // Remove parâmetros não utilizados em funções async
  content = content.replace(/async \(([^,]+), ([^)]+)\) => {/g, (match, param1, param2) => {
    // Se o segundo parâmetro não é usado, remove-o
    if (param2.includes('request') && !content.includes(`${param2}.`)) {
      return `async (${param1}) => {`;
    }
    return match;
  });
  
  // Remove parâmetros não utilizados em funções normais
  content = content.replace(/\(([^,]+), ([^)]+)\) => {/g, (match, param1, param2) => {
    if (param2.includes('request') && !content.includes(`${param2}.`)) {
      return `(${param1}) => {`;
    }
    return match;
  });
  
  return content;
}

// Função para corrigir problemas de environment variables
function fixEnvironmentVariables(content) {
  // Corrige acesso a process.env
  content = content.replace(/process\.env\.([A-Z_]+)/g, "process.env['$1']");
  return content;
}

// Função para corrigir problemas de tipos implícitos
function fixImplicitTypes(content) {
  // Adiciona tipos explícitos para parâmetros de callback
  content = content.replace(/\(([^)]+)\) => {/g, (match, params) => {
    if (params.includes('error') && !params.includes(':')) {
      return `(${params}: any) => {`;
    }
    if (params.includes('message') && !params.includes(':')) {
      return `(${params}: any) => {`;
    }
    if (params.includes('code') && !params.includes(':')) {
      return `(${params}: any) => {`;
    }
    if (params.includes('reason') && !params.includes(':')) {
      return `(${params}: any) => {`;
    }
    return match;
  });
  
  return content;
}

// Função para corrigir problemas de WebSocket
function fixWebSocketIssues(content) {
  // Corrige propriedades do WebSocket
  content = content.replace(/connection\.socket\./g, 'connection.');
  return content;
}

// Função para processar um arquivo
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    // Aplicar correções
    newContent = fixUnusedVariables(newContent);
    newContent = fixEnvironmentVariables(newContent);
    newContent = fixImplicitTypes(newContent);
    newContent = fixWebSocketIssues(newContent);
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed critical TypeScript errors in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Função principal
function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const patterns = [
    path.join(srcDir, 'routes', '*.ts'),
    path.join(srcDir, 'services', '*.ts'),
    path.join(srcDir, '*.ts')
  ];
  
  console.log('🔧 Fixing critical TypeScript errors...');
  
  let totalFixed = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern);
    files.forEach(file => {
      if (processFile(file)) {
        totalFixed++;
      }
    });
  });
  
  console.log(`\n🎉 Fixed ${totalFixed} files`);
}

if (require.main === module) {
  main();
}

module.exports = { processFile };
