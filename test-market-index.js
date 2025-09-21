#!/usr/bin/env node

/**
 * Script de teste para verificar o endpoint de market index
 * Testa a solução implementada para problemas intermitentes
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:13010';

async function testMarketIndex() {
  console.log('🧪 TESTE MARKET INDEX - Iniciando testes...\n');

  const tests = [
    {
      name: 'Teste 1: Requisição única',
      description: 'Testa uma requisição simples ao endpoint'
    },
    {
      name: 'Teste 2: Múltiplas requisições simultâneas',
      description: 'Testa 5 requisições simultâneas para verificar cache'
    },
    {
      name: 'Teste 3: Requisições com intervalo',
      description: 'Testa requisições com 1 segundo de intervalo'
    },
    {
      name: 'Teste 4: Teste de cache',
      description: 'Verifica se o cache está funcionando (2 requisições rápidas)'
    }
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log(`${'='.repeat(60)}`);

    try {
      switch (i) {
        case 0:
          await testSingleRequest();
          break;
        case 1:
          await testConcurrentRequests();
          break;
        case 2:
          await testIntervalRequests();
          break;
        case 3:
          await testCache();
          break;
      }
    } catch (error) {
      console.error(`❌ ${test.name} FALHOU:`, error.message);
    }
  }

  console.log('\n🎉 TESTES CONCLUÍDOS!');
}

async function testSingleRequest() {
  console.log('📡 Fazendo requisição única...');
  const start = Date.now();
  
  const response = await axios.get(`${BASE_URL}/api/market/index/public`, {
    timeout: 20000
  });
  
  const duration = Date.now() - start;
  
  console.log(`✅ Resposta recebida em ${duration}ms`);
  console.log(`📊 Status: ${response.status}`);
  console.log(`📊 Success: ${response.data.success}`);
  
  if (response.data.success && response.data.data) {
    const data = response.data.data;
    console.log(`📊 Index: ${data.index}`);
    console.log(`📊 24h Change: ${data.index24hChange}%`);
    console.log(`📊 Source: ${data.source}`);
    console.log(`📊 Next Funding: ${data.nextFunding}`);
  } else {
    console.log(`❌ Erro na resposta:`, response.data);
  }
}

async function testConcurrentRequests() {
  console.log('📡 Fazendo 5 requisições simultâneas...');
  const start = Date.now();
  
  const promises = Array(5).fill().map((_, i) => 
    axios.get(`${BASE_URL}/api/market/index/public`, {
      timeout: 20000
    }).then(response => ({
      index: i + 1,
      success: response.data.success,
      index: response.data.data?.index,
      source: response.data.data?.source,
      duration: Date.now() - start
    }))
  );
  
  const results = await Promise.allSettled(promises);
  const duration = Date.now() - start;
  
  console.log(`✅ Todas as requisições concluídas em ${duration}ms`);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const data = result.value;
      console.log(`  ${data.index}. Success: ${data.success}, Index: ${data.index}, Source: ${data.source}, Time: ${data.duration}ms`);
    } else {
      console.log(`  ${index + 1}. ERRO: ${result.reason.message}`);
    }
  });
}

async function testIntervalRequests() {
  console.log('📡 Fazendo 3 requisições com intervalo de 1 segundo...');
  
  for (let i = 1; i <= 3; i++) {
    console.log(`\n📡 Requisição ${i}/3...`);
    const start = Date.now();
    
    try {
      const response = await axios.get(`${BASE_URL}/api/market/index/public`, {
        timeout: 20000
      });
      
      const duration = Date.now() - start;
      console.log(`✅ Resposta ${i} em ${duration}ms - Index: ${response.data.data?.index}`);
    } catch (error) {
      console.log(`❌ Erro na requisição ${i}: ${error.message}`);
    }
    
    if (i < 3) {
      console.log('⏳ Aguardando 1 segundo...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function testCache() {
  console.log('📡 Testando cache (2 requisições rápidas)...');
  
  // Primeira requisição
  console.log('📡 Primeira requisição...');
  const start1 = Date.now();
  const response1 = await axios.get(`${BASE_URL}/api/market/index/public`, {
    timeout: 20000
  });
  const duration1 = Date.now() - start1;
  console.log(`✅ Primeira resposta em ${duration1}ms`);
  
  // Segunda requisição imediatamente após (deve usar cache de 30s)
  console.log('📡 Segunda requisição (deve usar cache de 30s)...');
  const start2 = Date.now();
  const response2 = await axios.get(`${BASE_URL}/api/market/index/public`, {
    timeout: 20000
  });
  const duration2 = Date.now() - start2;
  console.log(`✅ Segunda resposta em ${duration2}ms`);
  
  if (duration2 < duration1 * 0.5) {
    console.log('🎉 CACHE FUNCIONANDO! Segunda requisição foi muito mais rápida.');
  } else {
    console.log('⚠️ Cache pode não estar funcionando. Segunda requisição não foi significativamente mais rápida.');
  }
  
  console.log(`📊 Comparação: ${duration1}ms vs ${duration2}ms`);
  console.log('⚠️ NOTA: Cache é de apenas 30 segundos para garantir dados em tempo real');
}

// Executar testes
testMarketIndex().catch(console.error);
