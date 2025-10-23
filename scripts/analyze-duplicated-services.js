#!/usr/bin/env node

/**
 * Script de Análise de Serviços Duplicados
 * 
 * Mapeia todas as referências aos serviços duplicados para garantir
 * migração segura sem quebrar funcionalidades existentes.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Serviços duplicados identificados
const DUPLICATED_SERVICES = [
  'LNMarketsRobustService',
  'LNMarketsFallbackService', 
  'LNMarketsOptimizedService',
  'websocket-manager.service',
  'websocket-manager-optimized.service'
];

// Sufixos confusos a identificar
const CONFUSING_SUFFIXES = [
  'v2',
  'refactored', 
  'optimized',
  'robust',
  'fallback'
];

// Diretórios para análise
const BACKEND_DIR = './backend/src';
const FRONTEND_DIR = './frontend/src';
const DOCS_DIR = './docs';

console.log('🔍 ANÁLISE DE SERVIÇOS DUPLICADOS');
console.log('================================\n');

// Função para buscar referências em arquivos
function findReferences(serviceName, directory) {
  try {
    const result = execSync(`grep -r "${serviceName}" ${directory} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.md" || true`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    if (result.trim()) {
      return result.split('\n').filter(line => line.trim()).map(line => {
        const [file, ...rest] = line.split(':');
        return {
          file: file.trim(),
          content: rest.join(':').trim()
        };
      });
    }
    return [];
  } catch (error) {
    return [];
  }
}

// Função para analisar um serviço específico
function analyzeService(serviceName) {
  console.log(`\n📊 Analisando: ${serviceName}`);
  console.log('─'.repeat(50));
  
  const backendRefs = findReferences(serviceName, BACKEND_DIR);
  const frontendRefs = findReferences(serviceName, FRONTEND_DIR);
  const docsRefs = findReferences(serviceName, DOCS_DIR);
  
  const allRefs = [...backendRefs, ...frontendRefs, ...docsRefs];
  
  if (allRefs.length === 0) {
    console.log('✅ Nenhuma referência encontrada');
    return { service: serviceName, references: [], total: 0 };
  }
  
  console.log(`📁 ${allRefs.length} referências encontradas:`);
  
  // Agrupar por arquivo
  const refsByFile = {};
  allRefs.forEach(ref => {
    if (!refsByFile[ref.file]) {
      refsByFile[ref.file] = [];
    }
    refsByFile[ref.file].push(ref.content);
  });
  
  // Mostrar referências por arquivo
  Object.entries(refsByFile).forEach(([file, contents]) => {
    console.log(`\n  📄 ${file}`);
    contents.forEach(content => {
      console.log(`    ${content}`);
    });
  });
  
  return { 
    service: serviceName, 
    references: allRefs, 
    total: allRefs.length,
    files: Object.keys(refsByFile)
  };
}

// Função para buscar sufixos confusos
function findConfusingSuffixes() {
  console.log('\n🔍 BUSCANDO SUFIXOS CONFUSOS');
  console.log('─'.repeat(50));
  
  const results = {};
  
  CONFUSING_SUFFIXES.forEach(suffix => {
    const backendRefs = findReferences(suffix, BACKEND_DIR);
    const frontendRefs = findReferences(suffix, FRONTEND_DIR);
    
    const allRefs = [...backendRefs, ...frontendRefs];
    
    if (allRefs.length > 0) {
      results[suffix] = allRefs;
      console.log(`\n📊 Sufixo "${suffix}": ${allRefs.length} referências`);
      
      // Mostrar alguns exemplos
      allRefs.slice(0, 3).forEach(ref => {
        console.log(`  📄 ${ref.file}: ${ref.content.substring(0, 80)}...`);
      });
      
      if (allRefs.length > 3) {
        console.log(`  ... e mais ${allRefs.length - 3} referências`);
      }
    }
  });
  
  return results;
}

// Função para gerar relatório de impacto
function generateImpactReport(analysisResults) {
  console.log('\n📋 RELATÓRIO DE ANÁLISE DE IMPACTO');
  console.log('═'.repeat(60));
  
  const totalReferences = analysisResults.reduce((sum, result) => sum + result.total, 0);
  const totalFiles = new Set(analysisResults.flatMap(result => result.files)).size;
  
  console.log(`\n📊 RESUMO GERAL:`);
  console.log(`   • Total de serviços duplicados: ${analysisResults.length}`);
  console.log(`   • Total de referências: ${totalReferences}`);
  console.log(`   • Total de arquivos afetados: ${totalFiles}`);
  
  console.log(`\n🎯 PRIORIDADE DE MIGRAÇÃO:`);
  analysisResults
    .sort((a, b) => b.total - a.total)
    .forEach((result, index) => {
      const priority = index === 0 ? '🔴 ALTA' : index === 1 ? '🟡 MÉDIA' : '🟢 BAIXA';
      console.log(`   ${priority} ${result.service}: ${result.total} referências`);
    });
  
  console.log(`\n⚠️  ARQUIVOS CRÍTICOS (múltiplas referências):`);
  const fileCounts = {};
  analysisResults.forEach(result => {
    result.files.forEach(file => {
      fileCounts[file] = (fileCounts[file] || 0) + 1;
    });
  });
  
  Object.entries(fileCounts)
    .filter(([file, count]) => count > 1)
    .sort(([,a], [,b]) => b - a)
    .forEach(([file, count]) => {
      console.log(`   📄 ${file}: ${count} serviços duplicados`);
    });
}

// Função principal
function main() {
  console.log('🚀 Iniciando análise de serviços duplicados...\n');
  
  // Analisar cada serviço duplicado
  const analysisResults = DUPLICATED_SERVICES.map(analyzeService);
  
  // Buscar sufixos confusos
  const confusingSuffixes = findConfusingSuffixes();
  
  // Gerar relatório de impacto
  generateImpactReport(analysisResults);
  
  // Salvar relatório detalhado
  const report = {
    timestamp: new Date().toISOString(),
    duplicatedServices: analysisResults,
    confusingSuffixes,
    summary: {
      totalServices: analysisResults.length,
      totalReferences: analysisResults.reduce((sum, result) => sum + result.total, 0),
      totalFiles: new Set(analysisResults.flatMap(result => result.files)).size
    }
  };
  
  const reportPath = './reports/duplicated-services-analysis.json';
  fs.mkdirSync('./reports', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n💾 Relatório detalhado salvo em: ${reportPath}`);
  console.log('\n✅ Análise concluída!');
}

// Executar análise
main();
