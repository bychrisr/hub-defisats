# 📋 Documentação - Modais de Gerenciamento de Contas

## 🎯 **Visão Geral**

Este documento descreve os modais implementados para o gerenciamento de contas de exchange no sistema multi-account, incluindo criação, edição e ações de contas.

---

## 🚀 **CreateAccountModal**

### **Propósito**
Modal reutilizável para criação de novas contas de exchange, integrado com o sistema de limites por plano e validação de credenciais.

### **Localização**
```
frontend/src/components/modals/CreateAccountModal.tsx
```

### **Props**
```typescript
interface CreateAccountModalProps {
  isOpen: boolean;           // Estado de abertura do modal
  onClose: () => void;       // Função para fechar o modal
  onSuccess?: () => void;    // Callback de sucesso (opcional)
}
```

### **Funcionalidades**

#### **1. Seleção de Exchange**
- Dropdown com todas as exchanges disponíveis
- Carregamento dinâmico via `useExchangeCredentials`
- Validação de seleção obrigatória

#### **2. Credenciais Dinâmicas**
- Campos baseados no tipo de exchange selecionado
- Validação de campos obrigatórios
- Toggle de visibilidade para cada credencial
- Reset automático ao trocar de exchange

#### **3. Validação e Criação**
- Verificação de campos obrigatórios
- Validação de credenciais necessárias
- Integração com `useUserExchangeAccounts`
- Loading states durante criação
- Toast notifications para feedback

### **Hooks Utilizados**
- `useUserExchangeAccounts`: Criação de contas
- `useExchangeCredentials`: Lista de exchanges
- `usePlanLimits`: Validação de limites

### **Estados Gerenciados**
```typescript
const [isCreating, setIsCreating] = useState(false);
const [form, setForm] = useState({
  exchange_id: '',
  account_name: '',
  credentials: {} as Record<string, string>
});
const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
```

---

## 🎯 **AccountActionsModal**

### **Propósito**
Modal para gerenciar ações em contas existentes: edição, teste de credenciais, definição como ativa e exclusão.

### **Localização**
```
frontend/src/components/modals/AccountActionsModal.tsx
```

### **Props**
```typescript
interface AccountActionsModalProps {
  isOpen: boolean;                              // Estado de abertura
  onClose: () => void;                          // Função para fechar
  account: UserExchangeAccount | null;          // Conta selecionada
  onSuccess?: () => void;                       // Callback de sucesso
}
```

### **Funcionalidades**

#### **1. Edição de Conta**
- Atualização do nome da conta
- Edição de credenciais existentes
- Toggle de visibilidade para credenciais
- Validação de campos obrigatórios

#### **2. Teste de Credenciais**
- Validação de credenciais com a exchange
- Feedback visual de sucesso/erro
- Atualização do status de verificação

#### **3. Gerenciamento de Conta Ativa**
- Botão para definir como conta ativa
- Disponível apenas para contas inativas
- Feedback de confirmação

#### **4. Exclusão de Conta**
- Confirmação de exclusão
- Remoção permanente da conta
- Feedback de sucesso

### **Estados Gerenciados**
```typescript
const [isUpdating, setIsUpdating] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const [isTesting, setIsTesting] = useState(false);
const [isSettingActive, setIsSettingActive] = useState(false);
const [editForm, setEditForm] = useState({
  account_name: '',
  credentials: {} as Record<string, string>
});
const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
```

### **Inicialização de Form**
```typescript
useEffect(() => {
  if (account) {
    setEditForm({
      account_name: account.account_name,
      credentials: account.credentials || {}
    });
  }
}, [account]);
```

---

## 🔧 **Integração com AccountSelector**

### **Localização**
```
frontend/src/components/account/AccountSelector.tsx
```

### **Estados dos Modais**
```typescript
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
const [selectedAccount, setSelectedAccount] = useState<UserExchangeAccount | null>(null);
```

### **Funções de Controle**
```typescript
const handleCreateAccount = () => {
  setIsCreateModalOpen(true);
  setIsOpen(false);
};

const handleAccountActions = (account: UserExchangeAccount) => {
  setSelectedAccount(account);
  setIsActionsModalOpen(true);
  setIsOpen(false);
};

const handleModalSuccess = () => {
  loadAccounts(); // Refresh accounts list
};
```

### **Renderização dos Modais**
```typescript
return (
  <>
    <DropdownMenu>
      {/* ... dropdown content ... */}
    </DropdownMenu>

    <CreateAccountModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      onSuccess={handleModalSuccess}
    />

    <AccountActionsModal
      isOpen={isActionsModalOpen}
      onClose={() => setIsActionsModalOpen(false)}
      account={selectedAccount}
      onSuccess={handleModalSuccess}
    />
  </>
);
```

---

## 🎨 **Design System**

### **Componentes UI Utilizados**
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
- `Button` com variantes: `outline`, `ghost`, `destructive`
- `Input` com classes `coingecko-input` para tema
- `Label` para labels de formulário
- `toast` para notificações

### **Classes CSS Personalizadas**
- `coingecko-input`: Inputs com tema dinâmico
- `dropdown-glassmorphism`: Efeito glassmorphism para dropdowns
- `dropdown-glassmorphism-light`: Versão light do glassmorphism

### **Ícones Utilizados**
- `Eye`, `EyeOff`: Toggle de visibilidade de credenciais
- `Edit`: Edição de conta
- `TestTube`: Teste de credenciais
- `Trash2`: Exclusão de conta
- `Check`: Conta ativa
- `MoreVertical`: Menu de 3 pontos

---

## 🔄 **Fluxo de Dados**

### **1. Criação de Conta**
```
User Click → CreateAccountModal → useUserExchangeAccounts.createAccount → Backend API → Success Toast → Refresh List
```

### **2. Edição de Conta**
```
User Click (3 dots) → AccountActionsModal → useUserExchangeAccounts.updateAccount → Backend API → Success Toast → Refresh List
```

### **3. Teste de Credenciais**
```
User Click (Test) → AccountActionsModal → useUserExchangeAccounts.testCredentials → Backend API → Result Toast
```

### **4. Exclusão de Conta**
```
User Click (Delete) → AccountActionsModal → useUserExchangeAccounts.deleteAccount → Backend API → Success Toast → Refresh List
```

---

## 🧪 **Testes e Validação**

### **Cenários de Teste**
1. **Criação de Conta**
   - Seleção de exchange válida
   - Preenchimento de credenciais obrigatórias
   - Validação de limites por plano
   - Feedback de sucesso/erro

2. **Edição de Conta**
   - Alteração de nome da conta
   - Atualização de credenciais
   - Toggle de visibilidade
   - Validação de campos

3. **Teste de Credenciais**
   - Validação com exchange
   - Feedback de resultado
   - Atualização de status

4. **Exclusão de Conta**
   - Confirmação de exclusão
   - Remoção permanente
   - Atualização da lista

### **Estados de Loading**
- `isCreating`: Durante criação de conta
- `isUpdating`: Durante edição de conta
- `isTesting`: Durante teste de credenciais
- `isDeleting`: Durante exclusão de conta
- `isSettingActive`: Durante definição de conta ativa

---

## 📊 **Métricas e Monitoramento**

### **Logs de Debug**
```typescript
console.log('🔍 CREATE ACCOUNT MODAL - Creating account:', form);
console.log('✅ CREATE ACCOUNT MODAL - Account created successfully');
console.error('❌ CREATE ACCOUNT MODAL - Error creating account:', error);
```

### **Toast Notifications**
- **Sucesso**: "Exchange account created successfully"
- **Erro**: "Failed to create account"
- **Validação**: "Please fill in all required fields"
- **Limite**: "Account limit reached"

---

## 🚀 **Próximos Passos**

### **Melhorias Planejadas**
1. **Validação em Tempo Real**: Validação de credenciais durante digitação
2. **Histórico de Ações**: Log de ações realizadas nas contas
3. **Backup de Credenciais**: Sistema de backup automático
4. **Notificações Push**: Alertas para ações importantes

### **Integrações Futuras**
1. **FASE 6**: Integração com sistema de automações
2. **FASE 7**: Testes automatizados
3. **FASE 8**: Deploy e monitoramento
4. **FASE 9**: Documentação final

---

## 📝 **Notas Técnicas**

### **Segurança**
- Credenciais são criptografadas antes do envio
- Toggle de visibilidade para proteção de dados
- Validação de permissões por usuário

### **Performance**
- Lazy loading de modais
- Debounce em validações
- Cache de exchanges disponíveis

### **Acessibilidade**
- Navegação por teclado
- Screen reader support
- Contraste adequado para temas

---

**Última Atualização**: 2025-01-09  
**Versão**: v2.6.0  
**Status**: ✅ Concluído
