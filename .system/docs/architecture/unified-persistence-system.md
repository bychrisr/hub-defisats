# Sistema de Persistência Unificado

## Visão Geral

O Sistema de Persistência Unificado centraliza o armazenamento de configurações do usuário, incluindo indicadores de gráfico, preferências de dashboard e conta ativa. Este sistema substitui múltiplos sistemas de persistência por uma solução integrada e robusta.

## Arquitetura

### Estrutura de Dados

#### Interface Principal
```typescript
interface UnifiedPersistenceData {
  indicators: PersistedIndicatorState;
  userPreferences: UserPreferences;
  metadata: PersistenceMetadata;
}
```

#### Indicadores
```typescript
interface PersistedIndicatorState {
  rsi: PersistedIndicatorConfig;
  ema: PersistedIndicatorConfig;
  macd: PersistedIndicatorConfig;
  bollinger: PersistedIndicatorConfig;
  volume: PersistedIndicatorConfig;
}

interface PersistedIndicatorConfig {
  enabled: boolean;
  period: number;
  color: string;
  lineWidth: number;
  height: number;
}
```

#### Preferências do Usuário
```typescript
interface UserPreferences {
  activeAccountId: string | null;
  dashboardPreferences: {
    layout: string;
    cards: string[];
    theme: string;
  };
  uiSettings: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
}
```

#### Metadados
```typescript
interface PersistenceMetadata {
  version: string;
  lastUpdated: number;
  deviceId: string;
}
```

## Funcionalidades

### 1. Gerenciamento de Indicadores

#### Configuração Individual
```typescript
// Salvar configuração de indicador
saveIndicatorConfig(type: IndicatorType, config: PersistedIndicatorConfig): boolean

// Carregar configuração de indicador
loadIndicatorConfig(type: IndicatorType): PersistedIndicatorConfig | null
```

#### Configuração Completa
```typescript
// Salvar todas as configurações
saveAllConfigs(state: PersistedIndicatorState): boolean

// Carregar todas as configurações
loadAllConfigs(): { state: PersistedIndicatorState; metadata: PersistenceMetadata }
```

### 2. Gerenciamento de Conta Ativa

#### Conta Ativa
```typescript
// Definir conta ativa
setActiveAccount(accountId: string | null): boolean

// Obter conta ativa
getActiveAccount(): string | null

// Limpar conta ativa
clearActiveAccount(): boolean
```

#### Sincronização
- **Storage Events**: Sincronização entre abas
- **Custom Events**: Comunicação entre componentes
- **Real-time Updates**: Atualizações automáticas

### 3. Preferências do Usuário

#### Atualização de Preferências
```typescript
// Atualizar preferências
updateUserPreferences(preferences: Partial<UserPreferences>): boolean

// Obter preferências
getUserPreferences(): UserPreferences
```

#### Configurações Suportadas
- **Dashboard**: Layout, cards, tema
- **UI**: Idioma, timezone, notificações
- **Conta Ativa**: ID da conta selecionada

### 4. Dados Unificados

#### Carregamento
```typescript
// Carregar dados unificados
loadUnifiedData(): UnifiedPersistenceData
```

#### Salvamento
```typescript
// Salvar dados unificados
saveUnifiedData(data: UnifiedPersistenceData): boolean
```

## Implementação

### Serviço Principal

#### IndicatorPersistenceService
```typescript
class IndicatorPersistenceService {
  // Métodos de indicadores (existentes)
  saveIndicatorConfig(type: IndicatorType, config: PersistedIndicatorConfig): boolean
  loadIndicatorConfig(type: IndicatorType): PersistedIndicatorConfig | null
  loadAllConfigs(): { state: PersistedIndicatorState; metadata: PersistenceMetadata }
  saveAllConfigs(state: PersistedIndicatorState): boolean

  // Novos métodos para conta ativa
  setActiveAccount(accountId: string | null): boolean
  getActiveAccount(): string | null
  clearActiveAccount(): boolean

  // Novos métodos para preferências
  updateUserPreferences(preferences: Partial<UserPreferences>): boolean
  getUserPreferences(): UserPreferences

  // Métodos unificados
  loadUnifiedData(): UnifiedPersistenceData
  saveUnifiedData(data: UnifiedPersistenceData): boolean
}
```

### Hooks React

#### useActiveAccount
```typescript
interface UseActiveAccountReturn {
  activeAccountId: string | null;
  setActiveAccount: (accountId: string | null) => boolean;
  clearActiveAccount: () => boolean;
  isLoading: boolean;
  error: string | null;
}

function useActiveAccount(): UseActiveAccountReturn
```

#### useActiveAccountInfo
```typescript
interface ActiveAccountInfo {
  id: string | null;
  name: string | null;
  exchange: string | null;
  isActive: boolean;
}

function useActiveAccountInfo(): {
  accountInfo: ActiveAccountInfo | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}
```

## Migração

### Estrutura Antiga → Nova

#### Dados Antigos
```typescript
// Estrutura antiga
{
  state: PersistedIndicatorState,
  metadata: PersistenceMetadata
}
```

#### Dados Novos
```typescript
// Estrutura nova
{
  indicators: PersistedIndicatorState,
  userPreferences: UserPreferences,
  metadata: PersistenceMetadata
}
```

#### Migração Automática
```typescript
// Detecção e migração automática
if (data.state && !data.indicators) {
  return {
    indicators: data.state,
    userPreferences: data.userPreferences || getDefaultUserPreferences(),
    metadata: { ...data.metadata, version: '2.0.0' }
  };
}
```

## Validação e Segurança

### Validação de Dados
- **Estrutura**: Verificação de tipos e campos obrigatórios
- **Versão**: Compatibilidade entre versões
- **TTL**: Expiração automática de dados antigos
- **Integridade**: Verificação de consistência

### Segurança
- **LocalStorage**: Armazenamento local seguro
- **Criptografia**: Dados sensíveis criptografados
- **Sanitização**: Limpeza de dados de entrada
- **Auditoria**: Log de mudanças importantes

## Performance

### Otimizações
- **Lazy Loading**: Carregamento sob demanda
- **Caching**: Cache inteligente com TTL
- **Debouncing**: Evitar salvamentos excessivos
- **Compression**: Compressão de dados grandes

### Monitoramento
- **Storage Usage**: Uso de espaço no localStorage
- **Load Times**: Tempo de carregamento
- **Error Rates**: Taxa de erros
- **Migration Success**: Sucesso de migrações

## Testes

### Testes Unitários
```typescript
describe('IndicatorPersistenceService', () => {
  test('should save and load active account', () => {
    const service = new IndicatorPersistenceService();
    service.setActiveAccount('account-123');
    expect(service.getActiveAccount()).toBe('account-123');
  });

  test('should migrate old data structure', () => {
    const oldData = { state: {}, metadata: {} };
    const migrated = service.migrateData(oldData);
    expect(migrated.indicators).toBeDefined();
    expect(migrated.userPreferences).toBeDefined();
  });
});
```

### Testes de Integração
```typescript
describe('useActiveAccount Hook', () => {
  test('should sync across tabs', () => {
    // Simular evento de storage
    // Verificar sincronização
  });
});
```

## Troubleshooting

### Problemas Comuns

#### Dados Corrompidos
```typescript
// Detecção e recuperação
if (!validateStoredData(data)) {
  console.log('🧹 PERSISTENCE - Invalid data, using defaults');
  return getDefaultData();
}
```

#### Migração Falhada
```typescript
// Fallback para dados padrão
catch (error) {
  console.error('❌ PERSISTENCE - Migration failed:', error);
  return getDefaultData();
}
```

#### Storage Indisponível
```typescript
// Verificação de disponibilidade
private isStorageAvailable(): boolean {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch (e) {
    return false;
  }
}
```

## Roadmap

### Versão 2.0 ✅
- [x] Estrutura unificada
- [x] Migração automática
- [x] Hooks React
- [x] Sincronização entre abas

### Versão 2.1 📋
- [ ] Backup automático
- [ ] Sincronização com servidor
- [ ] Compressão de dados
- [ ] Analytics de uso

### Versão 2.2 📋
- [ ] Suporte offline
- [ ] Resolução de conflitos
- [ ] Versionamento de dados
- [ ] API de exportação/importação
