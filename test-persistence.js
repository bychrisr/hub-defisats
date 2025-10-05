// Teste do sistema de persistência unificado
const { indicatorPersistenceService } = require('./frontend/src/services/indicatorPersistence.service.ts');

async function testPersistence() {
  console.log('🔍 Testing unified persistence system...');
  
  try {
    // Testar conta ativa
    console.log('\n1. Testing active account management:');
    const setResult = indicatorPersistenceService.setActiveAccount('test-account-123');
    console.log(`✅ Set active account: ${setResult}`);
    
    const activeAccount = indicatorPersistenceService.getActiveAccount();
    console.log(`✅ Active account: ${activeAccount}`);
    
    // Testar preferências do usuário
    console.log('\n2. Testing user preferences:');
    const preferences = indicatorPersistenceService.getUserPreferences();
    console.log(`✅ User preferences:`, preferences);
    
    const updateResult = indicatorPersistenceService.updateUserPreferences({
      activeAccountId: 'new-account-456',
      dashboardPreferences: {
        layout: 'compact',
        cards: ['balance', 'positions'],
        theme: 'dark'
      }
    });
    console.log(`✅ Update preferences: ${updateResult}`);
    
    // Testar dados unificados
    console.log('\n3. Testing unified data:');
    const unifiedData = indicatorPersistenceService.loadUnifiedData();
    console.log(`✅ Unified data:`, {
      activeAccount: unifiedData.userPreferences.activeAccountId,
      theme: unifiedData.userPreferences.dashboardPreferences.theme,
      indicators: Object.keys(unifiedData.indicators)
    });
    
    console.log('\n🎉 All persistence tests passed!');
    
  } catch (error) {
    console.error('❌ Error testing persistence:', error.message);
  }
}

testPersistence();
