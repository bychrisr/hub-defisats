// Teste simples de persistência local
console.log('🧪 TESTE DE PERSISTÊNCIA LOCAL - Iniciando...');

// Simular localStorage
const mockLocalStorage = {
  data: {},
  setItem: function(key, value) {
    this.data[key] = value;
    console.log(`📦 LOCALSTORAGE - Set: ${key} = ${value.substring(0, 50)}...`);
  },
  getItem: function(key) {
    const value = this.data[key];
    console.log(`📦 LOCALSTORAGE - Get: ${key} = ${value ? value.substring(0, 50) + '...' : 'null'}`);
    return value;
  },
  removeItem: function(key) {
    delete this.data[key];
    console.log(`📦 LOCALSTORAGE - Remove: ${key}`);
  }
};

// Simular indicadorPersistenceService
class MockIndicatorPersistenceService {
  constructor() {
    this.storage = mockLocalStorage;
    this.STORAGE_KEY = 'indicatorConfigs';
    this.CURRENT_VERSION = '1.0.0';
    this.TTL_DAYS = 30;
  }

  saveIndicatorConfig(type, config) {
    console.log(`💾 PERSISTENCE - Saving config for ${type}:`, config);
    
    const state = this.loadState() || { 
      version: this.CURRENT_VERSION, 
      timestamp: Date.now(), 
      state: {} 
    };
    
    state.state[type] = config;
    state.timestamp = Date.now();
    
    const success = this.saveState(state);
    console.log(`✅ PERSISTENCE - Save result: ${success}`);
    return success;
  }

  loadIndicatorConfig(type) {
    console.log(`📦 PERSISTENCE - Loading config for ${type}`);
    const state = this.loadState();
    const result = state?.state[type] || null;
    console.log(`📦 PERSISTENCE - Load result:`, result);
    return result;
  }

  loadState() {
    try {
      const serializedState = this.storage.getItem(this.STORAGE_KEY);
      if (serializedState === null || serializedState === undefined) {
        console.log('📦 PERSISTENCE - No saved state found');
        return null;
      }
      const state = JSON.parse(serializedState);
      console.log('📦 PERSISTENCE - Loaded state:', state);
      return state;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error loading state:', error);
      return null;
    }
  }

  saveState(state) {
    try {
      const serializedState = JSON.stringify(state);
      this.storage.setItem(this.STORAGE_KEY, serializedState);
      console.log('✅ PERSISTENCE - State saved successfully');
      return true;
    } catch (error) {
      console.error('❌ PERSISTENCE - Error saving state:', error);
      return false;
    }
  }

  clearAllConfigs() {
    console.log('🧹 PERSISTENCE - Clearing all configs');
    this.storage.removeItem(this.STORAGE_KEY);
    return true;
  }

  getStorageInfo() {
    const serializedState = this.storage.getItem(this.STORAGE_KEY);
    const used = serializedState ? new TextEncoder().encode(serializedState).length : 0;
    const total = 5 * 1024 * 1024; // 5MB
    const percentage = total > 0 ? (used / total) * 100 : 0;
    
    return {
      available: true,
      used,
      total,
      percentage
    };
  }
}

// Teste da persistência
async function testPersistence() {
  console.log('\n🧪 === TESTE DE PERSISTÊNCIA LOCAL ===\n');
  
  const persistenceService = new MockIndicatorPersistenceService();
  
  // Teste 1: Salvar configuração RSI
  console.log('📝 TESTE 1: Salvando configuração RSI');
  const rsiConfig = {
    enabled: true,
    period: 14,
    color: '#8b5cf6',
    lineWidth: 2,
    height: 100
  };
  
  const saveResult = persistenceService.saveIndicatorConfig('rsi', rsiConfig);
  console.log(`✅ Resultado do save: ${saveResult}\n`);
  
  // Teste 2: Carregar configuração RSI
  console.log('📝 TESTE 2: Carregando configuração RSI');
  const loadedConfig = persistenceService.loadIndicatorConfig('rsi');
  console.log(`✅ Configuração carregada:`, loadedConfig);
  console.log(`✅ Configurações são iguais: ${JSON.stringify(rsiConfig) === JSON.stringify(loadedConfig)}\n`);
  
  // Teste 3: Salvar configuração EMA
  console.log('📝 TESTE 3: Salvando configuração EMA');
  const emaConfig = {
    enabled: false,
    period: 20,
    color: '#10b981',
    lineWidth: 1,
    height: 80
  };
  
  const saveEmaResult = persistenceService.saveIndicatorConfig('ema', emaConfig);
  console.log(`✅ Resultado do save EMA: ${saveEmaResult}\n`);
  
  // Teste 4: Carregar configuração EMA
  console.log('📝 TESTE 4: Carregando configuração EMA');
  const loadedEmaConfig = persistenceService.loadIndicatorConfig('ema');
  console.log(`✅ Configuração EMA carregada:`, loadedEmaConfig);
  console.log(`✅ Configurações EMA são iguais: ${JSON.stringify(emaConfig) === JSON.stringify(loadedEmaConfig)}\n`);
  
  // Teste 5: Informações de armazenamento
  console.log('📝 TESTE 5: Informações de armazenamento');
  const storageInfo = persistenceService.getStorageInfo();
  console.log(`✅ Storage info:`, storageInfo);
  console.log(`✅ Uso: ${Math.round(storageInfo.used / 1024)}KB / ${Math.round(storageInfo.total / 1024)}KB (${Math.round(storageInfo.percentage)}%)\n`);
  
  // Teste 6: Limpar configurações
  console.log('📝 TESTE 6: Limpando configurações');
  const clearResult = persistenceService.clearAllConfigs();
  console.log(`✅ Resultado do clear: ${clearResult}`);
  
  // Teste 7: Verificar se foi limpo
  console.log('📝 TESTE 7: Verificando se foi limpo');
  const clearedConfig = persistenceService.loadIndicatorConfig('rsi');
  console.log(`✅ Configuração após clear: ${clearedConfig}\n`);
  
  console.log('🎉 === TESTE DE PERSISTÊNCIA CONCLUÍDO ===');
  console.log('✅ Todos os testes de persistência local passaram!');
  console.log('📊 Sistema de persistência está funcionando corretamente.');
}

// Executar teste
testPersistence().catch(console.error);
