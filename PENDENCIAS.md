# 📋 PENDÊNCIAS - HUB DEFISATS

## 🔐 FORGOT PASSWORD - PENDÊNCIAS

### ⚠️ **CRÍTICAS (Necessárias para funcionar)**
- [ ] **Configurar servidor de email** (SMTP)
  - [ ] Definir credenciais SMTP no `.env`
  - [ ] Testar envio de emails
  - [ ] Configurar templates de email personalizados
- [ ] **Configurar Redis** para armazenamento de tokens
  - [ ] Verificar conexão Redis
  - [ ] Testar armazenamento de tokens
  - [ ] Configurar TTL adequado
- [ ] **Configurar CORS_ORIGIN** para links de reset
  - [ ] Definir URL base para links de email
  - [ ] Testar links gerados

### 🔧 **IMPORTANTES (Melhorias)**
- [ ] **Templates de email personalizados**
  - [ ] Design moderno para emails
  - [ ] Branding Axisor Bot
  - [ ] Versão mobile-friendly
- [ ] **Rate limiting refinado**
  - [ ] Configurar limites por usuário
  - [ ] Implementar cooldown progressivo
  - [ ] Logs de tentativas suspeitas
- [ ] **Validação de email**
  - [ ] Verificar se email existe antes de enviar
  - [ ] Implementar verificação de domínio
  - [ ] Blacklist de emails temporários

### 🎨 **UX/UI (Opcionais)**
- [ ] **Página de confirmação de email enviado**
  - [ ] Mostrar tempo estimado de chegada
  - [ ] Opção de reenviar email
  - [ ] Instruções para verificar spam
- [ ] **Melhorar feedback visual**
  - [ ] Animações mais suaves
  - [ ] Estados de loading mais informativos
  - [ ] Mensagens de erro mais específicas

---

## 📝 CADASTRO FASEADO - PENDÊNCIAS

### ⚠️ **CRÍTICAS (Necessárias para funcionar)**
- [ ] **Rotas backend para cadastro faseado**
  - [ ] `POST /api/registration/personal-data`
  - [ ] `POST /api/registration/select-plan`
  - [ ] `POST /api/registration/payment`
  - [ ] `POST /api/registration/credentials`
- [ ] **Integração frontend-backend**
  - [ ] Conectar páginas React com APIs
  - [ ] Implementar navegação entre etapas
  - [ ] Salvar progresso no banco
- [ ] **Sistema de cupons**
  - [ ] Validação de cupons
  - [ ] Lógica para pular etapas (lifetime)
  - [ ] Aplicação de descontos

### 🔧 **IMPORTANTES (Melhorias)**
- [ ] **Validação robusta por etapa**
  - [ ] Middleware específico para cada etapa
  - [ ] Validação de dados em tempo real
  - [ ] Prevenção de bypass de etapas
- [ ] **Sistema de pagamento Lightning**
  - [ ] Integração com Lightning Payment Service
  - [ ] Geração de invoices
  - [ ] Verificação de pagamento
- [ ] **Gestão de sessões temporárias**
  - [ ] Tokens para usuários não autenticados
  - [ ] Expiração automática
  - [ ] Limpeza de dados temporários

### 🎨 **UX/UI (Opcionais)**
- [ ] **Progress bar visual**
  - [ ] Indicador de progresso
  - [ ] Navegação entre etapas
  - [ ] Salvar e continuar depois
- [ ] **Validação em tempo real**
  - [ ] Verificação de email disponível
  - [ ] Verificação de username disponível
  - [ ] Validação de cupons em tempo real

---

## 🚀 OUTRAS FUNCIONALIDADES - PENDÊNCIAS

### 🔐 **AUTENTICAÇÃO**
- [ ] **Login social (Google/GitHub)**
  - [ ] Implementar OAuth providers
  - [ ] Configurar credenciais
  - [ ] Integração com banco de dados
- [ ] **Two-Factor Authentication (2FA)**
  - [ ] Implementar TOTP
  - [ ] Backup codes
  - [ ] QR code generation

### 💳 **PAGAMENTOS**
- [ ] **Integração Lightning completa**
  - [ ] Múltiplos providers (LND, LNbits, etc)
  - [ ] Webhook para confirmação
  - [ ] Histórico de pagamentos
- [ ] **Sistema de assinaturas**
  - [ ] Renovação automática
  - [ ] Upgrade/downgrade de planos
  - [ ] Cancelamento

### 📊 **ADMINISTRAÇÃO**
- [ ] **Dashboard administrativo**
  - [ ] Métricas de usuários
  - [ ] Logs de sistema
  - [ ] Gestão de cupons
- [ ] **Monitoramento**
  - [ ] Health checks
  - [ ] Performance metrics
  - [ ] Error tracking

---

## 🎯 PRIORIDADES

### **FASE 1 - CRÍTICA** 🔴
1. Configurar servidor de email para forgot password
2. Implementar rotas backend para cadastro faseado
3. Integração frontend-backend do cadastro

### **FASE 2 - IMPORTANTE** 🟡
1. Sistema de cupons completo
2. Validação robusta por etapa
3. Sistema de pagamento Lightning

### **FASE 3 - MELHORIAS** 🟢
1. UX/UI refinements
2. Funcionalidades avançadas
3. Monitoramento e admin

---

## 📝 NOTAS

- **Database**: RegistrationProgress table já implementada ✅
- **Forgot Password**: Backend e frontend implementados ✅
- **Login**: Funcional com email/username ✅
- **Payment Page**: Implementada com Lightning fees ✅

---

*Última atualização: $(date)*
