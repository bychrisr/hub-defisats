#!/usr/bin/env node

/**
 * 🧪 TESTE DE REDIRECIONAMENTO DE AUTENTICAÇÃO
 * 
 * Este script testa se o redirecionamento de autenticação está funcionando corretamente
 * quando um usuário não autenticado tenta acessar rotas protegidas.
 */

const axios = require('axios');

const CONFIG = {
  BASE_URL: 'http://localhost:13000',
  PROTECTED_ROUTES: [
    '/dashboard',
    '/profile',
    '/positions',
    '/automation',
    '/test-auth'
  ],
  ADMIN_ROUTES: [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/load-test'
  ]
};

async function testRouteRedirect(route) {
  console.log(`\n🔍 Testando rota: ${route}`);
  
  try {
    const response = await axios.get(`${CONFIG.BASE_URL}${route}`, {
      maxRedirects: 0, // Não seguir redirecionamentos automaticamente
      validateStatus: (status) => status < 400, // Aceitar códigos de sucesso
      timeout: 5000
    });
    
    console.log(`❌ PROBLEMA: Rota ${route} retornou status ${response.status} sem redirecionamento`);
    console.log(`   Headers:`, {
      'content-type': response.headers['content-type'],
      'location': response.headers['location'] || 'NÃO ENCONTRADO'
    });
    
    return false;
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const location = error.response.headers['location'];
      
      if (status === 302 || status === 301) {
        if (location && location.includes('/login')) {
          console.log(`✅ SUCESSO: Rota ${route} redirecionou corretamente para login`);
          console.log(`   Status: ${status}, Location: ${location}`);
          return true;
        } else {
          console.log(`⚠️  ATENÇÃO: Rota ${route} redirecionou, mas não para login`);
          console.log(`   Status: ${status}, Location: ${location}`);
          return false;
        }
      } else {
        console.log(`❌ PROBLEMA: Rota ${route} retornou status ${status} inesperado`);
        return false;
      }
    } else {
      console.log(`❌ ERRO: Falha ao testar rota ${route}:`, error.message);
      return false;
    }
  }
}

async function testAllRoutes() {
  console.log('🚀 INICIANDO TESTE DE REDIRECIONAMENTO DE AUTENTICAÇÃO');
  console.log('=' .repeat(60));
  
  const results = {
    protected: [],
    admin: [],
    total: 0,
    success: 0
  };
  
  // Testar rotas protegidas
  console.log('\n📋 TESTANDO ROTAS PROTEGIDAS:');
  for (const route of CONFIG.PROTECTED_ROUTES) {
    const success = await testRouteRedirect(route);
    results.protected.push({ route, success });
    results.total++;
    if (success) results.success++;
  }
  
  // Testar rotas admin
  console.log('\n👑 TESTANDO ROTAS ADMINISTRATIVAS:');
  for (const route of CONFIG.ADMIN_ROUTES) {
    const success = await testRouteRedirect(route);
    results.admin.push({ route, success });
    results.total++;
    if (success) results.success++;
  }
  
  // Relatório final
  console.log('\n📊 RELATÓRIO FINAL:');
  console.log('=' .repeat(40));
  console.log(`Total de rotas testadas: ${results.total}`);
  console.log(`Redirecionamentos corretos: ${results.success}`);
  console.log(`Taxa de sucesso: ${((results.success / results.total) * 100).toFixed(1)}%`);
  
  console.log('\n📋 ROTAS PROTEGIDAS:');
  results.protected.forEach(({ route, success }) => {
    console.log(`  ${success ? '✅' : '❌'} ${route}`);
  });
  
  console.log('\n👑 ROTAS ADMINISTRATIVAS:');
  results.admin.forEach(({ route, success }) => {
    console.log(`  ${success ? '✅' : '❌'} ${route}`);
  });
  
  if (results.success === results.total) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Redirecionamento funcionando corretamente.');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM! Verificar implementação do redirecionamento.');
  }
  
  return results.success === results.total;
}

// Executar teste
if (require.main === module) {
  testAllRoutes()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro crítico no teste:', error);
      process.exit(1);
    });
}

module.exports = { testAllRoutes, testRouteRedirect };
