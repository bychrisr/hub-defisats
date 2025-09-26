# Sistema de Verificação de Versão

## 📋 Visão Geral

O Sistema de Verificação de Versão é uma funcionalidade que notifica automaticamente os usuários quando uma nova versão da aplicação está disponível, permitindo que eles atualizem a página para receber as melhorias e correções mais recentes.

## 🎯 Objetivos

- **Notificação Automática**: Usuários são notificados automaticamente sobre novas versões
- **UX Melhorada**: Interface elegante e não intrusiva para notificação
- **Zero Configuração**: Sistema funciona automaticamente sem intervenção do usuário
- **Performance**: Verificação eficiente com cache e otimizações

## 🏗️ Arquitetura

### Backend

#### Endpoint: `GET /api/version`
```typescript
interface VersionResponse {
  version: string;        // Versão atual (ex: "1.3.0")
  buildTime: string;      // Timestamp do build
  environment: string;    // Ambiente (development/production)
  features: string[];     // Lista de funcionalidades disponíveis
}
```

#### Controller: `version.controller.ts`
- Lê informações do `package.json` e `build-info.json`
- Retorna dados da versão com headers de cache
- Tratamento de erros robusto

#### Rota: `version.routes.ts`
- Endpoint público (não requer autenticação)
- Schema de validação OpenAPI
- Headers de cache (5 minutos)

### Frontend

#### VersionService (`version.service.ts`)
```typescript
class VersionService {
  startVersionCheck(): void;           // Inicia verificação periódica
  stopVersionCheck(): void;            // Para verificação
  checkForUpdates(): Promise<VersionCheckResult>; // Verifica atualizações
  forceCheck(): Promise<VersionCheckResult>;      // Força verificação
  getCurrentVersion(): string;         // Obtém versão atual
  hasBeenNotified(version: string): boolean; // Verifica se foi notificado
  markAsNotified(version: string): void;     // Marca como notificado
}
```

#### VersionContext (`VersionContext.tsx`)
```typescript
interface VersionContextType {
  versionInfo: VersionCheckResult | null;
  hasUpdate: boolean;
  isChecking: boolean;
  checkForUpdates: () => Promise<void>;
  markAsNotified: () => void;
  forceCheck: () => Promise<void>;
}
```

#### UpdateNotification (`UpdateNotification.tsx`)
- Componente de popup responsivo
- Design moderno com animações
- Ações: Atualizar Agora, Mais Tarde, Dispensar
- Informações detalhadas da versão

## 🔄 Fluxo de Funcionamento

### 1. Inicialização
```mermaid
graph TD
    A[Usuário faz login] --> B[VersionProvider inicia]
    B --> C[VersionService.startVersionCheck()]
    C --> D[Verificação imediata]
    D --> E[Configura verificação periódica]
```

### 2. Verificação Periódica
```mermaid
graph TD
    A[Timer 5 minutos] --> B[VersionService.checkForUpdates()]
    B --> C[GET /api/version]
    C --> D{Nova versão?}
    D -->|Sim| E[Atualiza estado]
    D -->|Não| F[Log: App atualizado]
    E --> G[Popup aparece]
    F --> A
```

### 3. Notificação ao Usuário
```mermaid
graph TD
    A[Popup aparece] --> B{Usuário escolhe}
    B -->|Atualizar| C[window.location.reload()]
    B -->|Mais Tarde| D[Fecha popup temporariamente]
    B -->|Dispensar| E[Marca como notificado]
    C --> F[Página recarrega com nova versão]
    D --> G[Reaparece em próxima verificação]
    E --> H[Não aparece mais para esta versão]
```

## ⚙️ Configuração

### Backend

#### 1. Arquivo `build-info.json`
```json
{
  "version": "1.3.0",
  "buildTime": "2025-09-22T12:26:42.774Z",
  "environment": "development",
  "features": [
    "trading",
    "analytics",
    "admin-panel",
    "notifications",
    "automation",
    "version-check"
  ],
  "buildId": "build-2025-09-22T12-26-42-774Z",
  "gitCommit": "def456ghi789",
  "nodeVersion": "18.17.0"
}
```

#### 2. Atualização da Versão
Para simular uma nova versão:
```bash
# Atualizar build-info.json
{
  "version": "1.4.0",
  "buildTime": "2025-09-22T15:00:00.000Z",
  "features": [...]
}

# Reiniciar backend para aplicar mudanças
docker compose restart backend
```

### Frontend

#### 1. Integração no App.tsx
```tsx
<VersionProvider autoCheck={true}>
  <RealtimeDataProvider>
    {/* ... outros providers */}
    <UpdateNotification />
    <BrowserRouter>
      {/* ... rotas */}
    </BrowserRouter>
  </RealtimeDataProvider>
</VersionProvider>
```

#### 2. Configuração do VersionProvider
```tsx
<VersionProvider 
  autoCheck={true}           // Verificação automática habilitada
  checkInterval={300000}     // Intervalo em ms (5 minutos)
>
  {children}
</VersionProvider>
```

## 🎨 Interface do Usuário

### Popup de Atualização

```
┌─────────────────────────────────────────┐
│ 🔄 Nova Versão Disponível               │
│                                         │
│ Uma nova versão da aplicação está      │
│ disponível. Para aproveitar as         │
│ melhorias e correções mais recentes,   │
│ recomendamos que você atualize agora.  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Versão Atual: v1.0.0               │ │
│ │ Nova Versão: v1.3.0                │ │
│ │ Build: 22/09/2025 12:26            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Novidades nesta versão:                │
│ ✓ Version check                        │
│ ✓ New feature 1                        │
│ ✓ New feature 2                        │
│                                         │
│ [Atualizar Agora] [Mais Tarde] [✕]     │
│                                         │
│ ⚠️ A atualização recarregará a página  │
│    automaticamente. Certifique-se de   │
│    salvar seu trabalho antes de        │
│    continuar.                          │
└─────────────────────────────────────────┘
```

### Estados do Sistema

#### 1. Verificando Atualizações
- Indicador de loading discreto
- Log no console: "🔄 VERSION SERVICE - Checking for updates..."

#### 2. Atualização Disponível
- Popup aparece automaticamente
- Log: "🆕 VERSION SERVICE - New version available!"

#### 3. Aplicação Atualizada
- Log: "✅ VERSION SERVICE - App is up to date"
- Nenhuma notificação

## 🔧 API Reference

### GET /api/version

**Descrição**: Retorna informações da versão atual da aplicação

**Headers**:
- `Cache-Control: public, max-age=300` (5 minutos)
- `ETag: "version-buildTime"`

**Response 200**:
```json
{
  "version": "1.3.0",
  "buildTime": "2025-09-22T12:26:42.774Z",
  "environment": "development",
  "features": [
    "trading",
    "analytics",
    "admin-panel",
    "notifications",
    "automation",
    "version-check"
  ]
}
```

**Response 500**:
```json
{
  "error": "VERSION_ERROR",
  "message": "Failed to get version information",
  "details": "Error details in development"
}
```

## 🧪 Testes

### Teste Manual

1. **Simular Nova Versão**:
   ```bash
   # Atualizar build-info.json
   echo '{"version": "1.4.0", "buildTime": "'$(date -Iseconds)'", ...}' > backend/build-info.json
   
   # Reiniciar backend
   docker compose restart backend
   ```

2. **Verificar Endpoint**:
   ```bash
   curl -X GET "http://localhost:13010/api/version" | jq .
   ```

3. **Testar Frontend**:
   - Fazer login na aplicação
   - Aguardar verificação automática (5 minutos)
   - Ou forçar verificação no console: `versionService.forceCheck()`

### Teste Automatizado

```typescript
// Exemplo de teste unitário
describe('VersionService', () => {
  it('should detect new version', async () => {
    const result = await versionService.checkForUpdates();
    expect(result.hasUpdate).toBe(true);
    expect(result.latestVersion).toBe('1.3.0');
  });
});
```

## 📊 Monitoramento

### Logs do Backend
```
🔍 VERSION CONTROLLER - Getting version info...
📦 VERSION CONTROLLER - Package path: /app/package.json
✅ VERSION CONTROLLER - Package.json loaded: 1.0.0
📦 VERSION CONTROLLER - Build info path: /app/build-info.json
✅ VERSION CONTROLLER - Build info loaded: { version: '1.3.0', ... }
📦 VERSION CONTROLLER - Final version info: { version: '1.3.0', ... }
```

### Logs do Frontend
```
🔄 VERSION SERVICE - Starting periodic version check
🔍 VERSION SERVICE - Checking for updates...
📦 VERSION SERVICE - Server version info: { version: '1.3.0', ... }
🆕 VERSION SERVICE - New version available! { current: '1.0.0', latest: '1.3.0' }
```

## 🚀 Deploy

### Processo de Deploy

1. **Atualizar Versão**:
   ```bash
   # Atualizar build-info.json com nova versão
   {
     "version": "1.4.0",
     "buildTime": "2025-09-22T15:00:00.000Z",
     "features": ["trading", "analytics", "admin-panel", "notifications", "automation", "version-check", "new-feature"]
   }
   ```

2. **Deploy Backend**:
   ```bash
   docker compose up -d backend
   ```

3. **Deploy Frontend**:
   ```bash
   docker compose up -d frontend
   ```

4. **Verificação**:
   - Usuários logados receberão notificação automática
   - Endpoint `/api/version` retorna nova versão
   - Sistema funciona automaticamente

### Rollback

Se necessário fazer rollback:

1. **Reverter build-info.json** para versão anterior
2. **Reiniciar containers**:
   ```bash
   docker compose restart backend frontend
   ```
3. **Usuários** receberão notificação da versão "anterior" (que na verdade é a versão estável)

## 🔒 Segurança

### Considerações de Segurança

1. **Endpoint Público**: `/api/version` não requer autenticação
2. **Rate Limiting**: Aplicado pelo middleware global
3. **Cache Control**: Headers apropriados para evitar abuso
4. **Validação**: Dados validados antes de retornar

### Headers de Segurança

```
Cache-Control: public, max-age=300
ETag: "1.3.0-2025-09-22T12:26:42.774Z"
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```

## 📈 Performance

### Otimizações Implementadas

1. **Cache de 5 minutos** no endpoint
2. **ETag** para verificação eficiente
3. **Verificação periódica** em vez de polling constante
4. **localStorage** para persistir estado
5. **Cleanup automático** de timers

### Métricas Esperadas

- **Tempo de resposta**: < 100ms
- **Uso de memória**: < 1MB adicional
- **Requisições**: 1 a cada 5 minutos por usuário ativo
- **Cache hit rate**: > 95%

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Popup não aparece
**Causa**: Usuário já foi notificado desta versão
**Solução**: Limpar localStorage ou aguardar nova versão

#### 2. Verificação não funciona
**Causa**: Endpoint `/api/version` indisponível
**Solução**: Verificar logs do backend e conectividade

#### 3. Versão incorreta
**Causa**: `build-info.json` não atualizado
**Solução**: Atualizar arquivo e reiniciar backend

#### 4. Popup aparece constantemente
**Causa**: Sistema não consegue marcar como notificado
**Solução**: Verificar localStorage e permissões

### Debug

```javascript
// Console do navegador
versionService.getCurrentVersion();           // Versão atual
versionService.forceCheck();                 // Força verificação
versionService.getStoredVersionInfo();       // Info salva
localStorage.getItem('notified_versions');   // Versões notificadas
```

## 📚 Referências

- [Semantic Versioning](https://semver.org/)
- [React Context API](https://reactjs.org/docs/context.html)
- [Fastify Caching](https://www.fastify.io/docs/latest/Reference/Reply/#cache)
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

**Versão do Documento**: 1.0.0  
**Última Atualização**: 2025-09-22  
**Autor**: Sistema de Verificação de Versão - defiSATS
