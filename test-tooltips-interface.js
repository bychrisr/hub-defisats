#!/usr/bin/env node

/**
 * Teste da Interface de Tooltips
 * Verifica se a interface administrativa de tooltips está funcionando corretamente
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:13010/api';
const FRONTEND_URL = 'http://localhost:13000';

async function testTooltipsInterface() {
  console.log('🧪 TESTE DA INTERFACE DE TOOLTIPS');
  console.log('=====================================');

  try {
    // 1. Testar endpoint de cards com tooltips
    console.log('\n1. Testando endpoint /cards-with-tooltips...');
    const cardsResponse = await axios.get(`${BASE_URL}/cards-with-tooltips`);
    
    if (cardsResponse.data.success) {
      console.log('✅ Endpoint funcionando');
      console.log(`   - ${cardsResponse.data.data.length} cards encontrados`);
      
      // Verificar se todos os cards têm tooltips
      const cardsWithTooltips = cardsResponse.data.data.filter(card => card.tooltip);
      console.log(`   - ${cardsWithTooltips.length} cards com tooltips configurados`);
      
      // Mostrar alguns exemplos
      cardsResponse.data.data.slice(0, 3).forEach(card => {
        console.log(`   - ${card.title}: ${card.tooltip ? '✅' : '❌'} tooltip`);
      });
    } else {
      console.log('❌ Endpoint falhou');
      return false;
    }

    // 2. Testar endpoint de tooltips
    console.log('\n2. Testando endpoint /tooltips...');
    const tooltipsResponse = await axios.get(`${BASE_URL}/tooltips`);
    
    if (tooltipsResponse.data.success) {
      console.log('✅ Endpoint funcionando');
      console.log(`   - ${tooltipsResponse.data.data.length} tooltips encontrados`);
    } else {
      console.log('❌ Endpoint falhou');
      return false;
    }

    // 3. Testar endpoint de dashboard cards
    console.log('\n3. Testando endpoint /dashboard-cards...');
    const dashboardCardsResponse = await axios.get(`${BASE_URL}/dashboard-cards`);
    
    if (dashboardCardsResponse.data.success) {
      console.log('✅ Endpoint funcionando');
      console.log(`   - ${dashboardCardsResponse.data.data.length} cards encontrados`);
    } else {
      console.log('❌ Endpoint falhou');
      return false;
    }

    // 4. Verificar se o frontend está acessível
    console.log('\n4. Testando acessibilidade do frontend...');
    const frontendResponse = await axios.get(FRONTEND_URL);
    
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend acessível');
    } else {
      console.log('❌ Frontend não acessível');
      return false;
    }

    // 5. Verificar estrutura dos dados
    console.log('\n5. Verificando estrutura dos dados...');
    const sampleCard = cardsResponse.data.data[0];
    
    const requiredCardFields = ['id', 'key', 'title', 'description', 'icon', 'category', 'order_index', 'is_active', 'is_admin_only'];
    const requiredTooltipFields = ['id', 'card_key', 'tooltip_text', 'tooltip_position', 'is_enabled'];
    
    const cardFieldsValid = requiredCardFields.every(field => sampleCard.hasOwnProperty(field));
    const tooltipFieldsValid = sampleCard.tooltip ? requiredTooltipFields.every(field => sampleCard.tooltip.hasOwnProperty(field)) : true;
    
    if (cardFieldsValid) {
      console.log('✅ Estrutura dos cards válida');
    } else {
      console.log('❌ Estrutura dos cards inválida');
      return false;
    }
    
    if (tooltipFieldsValid) {
      console.log('✅ Estrutura dos tooltips válida');
    } else {
      console.log('❌ Estrutura dos tooltips inválida');
      return false;
    }

    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('A interface de tooltips está funcionando corretamente.');
    
    return true;

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    return false;
  }
}

// Executar teste
testTooltipsInterface()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
    process.exit(1);
  });
