# Pendências Externas (Owner Tasks)

Este documento registra tarefas que dependem de ações externas ao desenvolvimento, como configurações de infraestrutura, integrações com serviços terceiros, ou decisões de negócio.

## 🔑 Integrações e APIs

### LN Markets API
- [x] **Configurar conta sandbox** para testes de desenvolvimento ✅ RESOLVIDO
- [ ] **Obter credenciais de produção** para deploy inicial
- [x] **Validar rate limits** e documentar limites por endpoint ✅ RESOLVIDO
- [ ] **Testar webhooks** (se disponíveis) para notificações em tempo real
- [ ] **Configurar IPs permitidos** para API de produção
- [ ] **Definir estratégia de backup** para dados da LN Markets

### Lightning Network
- [ ] **Configurar LND node** ou **LNbits** para pagamentos externos
- [ ] **Definir preços em sats** para planos (Basic, Advanced, Pro)
- [ ] **Configurar webhook** para validação automática de pagamentos
- [ ] **Testar invoices** em ambiente de desenvolvimento
- [ ] **Configurar backup** de chaves Lightning
- [ ] **Definir estratégia de liquidez** para pagamentos

### Serviços de Notificação
- [ ] **Criar bot Telegram** para notificações
  - [ ] Obter token do bot via @BotFather
  - [ ] Configurar comandos e handlers
  - [ ] Testar envio de mensagens
- [ ] **Configurar EvolutionAPI** para WhatsApp
  - [ ] Criar conta na EvolutionAPI
  - [ ] Configurar webhook para status de mensagens
  - [ ] Testar envio de mensagens
- [ ] **Configurar SMTP** para emails (Gmail/SendGrid)
  - [ ] Configurar conta de email profissional
  - [ ] Configurar DKIM e SPF
  - [ ] Testar envio de emails
- [ ] **Definir templates** de mensagens para cada tipo de alerta
- [ ] **Configurar rate limiting** para serviços de notificação

## 🏗️ Infraestrutura

### AWS/Cloud Provider
- [ ] **Configurar conta AWS** ou provider alternativo
  - [ ] Criar conta AWS com billing alerts
  - [ ] Configurar IAM users e roles
  - [ ] Configurar MFA para conta root
- [ ] **Configurar RDS PostgreSQL** para produção
  - [ ] Criar instância RDS com backup automático
  - [ ] Configurar security groups
  - [ ] Configurar monitoring e alertas
- [ ] **Configurar ElastiCache Redis** para cache e filas
  - [ ] Criar cluster Redis com replicação
  - [ ] Configurar backup automático
  - [ ] Configurar monitoring
- [ ] **Configurar EKS** ou similar para Kubernetes
  - [ ] Criar cluster EKS
  - [ ] Configurar node groups
  - [ ] Configurar ingress controller
- [ ] **Configurar Load Balancer** e SSL/TLS
  - [ ] Configurar Application Load Balancer
  - [ ] Configurar SSL certificates
  - [ ] Configurar health checks

### Domínio e SSL
- [ ] **Registrar domínio** para produção
  - [ ] Escolher domínio (.com, .io, .app)
  - [ ] Registrar domínio
  - [ ] Configurar DNS
- [ ] **Configurar DNS** (A records, CNAME)
  - [ ] Configurar A records para servidores
  - [ ] Configurar CNAME para subdomínios
  - [ ] Configurar MX records para email
- [ ] **Configurar Certbot** para SSL automático
  - [ ] Instalar Certbot
  - [ ] Configurar renovação automática
  - [ ] Testar certificados
- [ ] **Configurar Nginx** como reverse proxy
  - [ ] Instalar e configurar Nginx
  - [ ] Configurar SSL termination
  - [ ] Configurar rate limiting

### Monitoramento
- [ ] **Configurar Prometheus + Grafana** para métricas
  - [ ] Instalar Prometheus
  - [ ] Instalar Grafana
  - [ ] Configurar dashboards
  - [ ] Configurar alertas
- [ ] **Configurar Sentry** para error tracking
  - [ ] Criar conta Sentry
  - [ ] Configurar projetos (backend, frontend)
  - [ ] Configurar alertas por email/Slack
- [ ] **Configurar ELK Stack** para logs centralizados
  - [ ] Instalar Elasticsearch
  - [ ] Instalar Logstash
  - [ ] Instalar Kibana
  - [ ] Configurar log shipping
- [ ] **Definir alertas** para métricas críticas
  - [ ] Configurar alertas de CPU/Memory
  - [ ] Configurar alertas de disk space
  - [ ] Configurar alertas de API errors
  - [ ] Configurar alertas de security

## 💰 Negócio e Monetização

### Planos e Preços
- [ ] **Definir preços finais** em sats para cada plano
  - [ ] Basic: 10,000 sats/mês
  - [ ] Advanced: 25,000 sats/mês
  - [ ] Pro: 50,000 sats/mês
  - [ ] Lifetime: 500,000 sats
- [ ] **Criar cupons de teste** para testers iniciais
  - [ ] ALPHATESTER (vitalício) - 30 usos
  - [ ] BETAUSER (3 meses) - 100 usos
  - [ ] EARLYBIRD (50% desconto) - 50 usos
- [ ] **Definir limite de testers** (sugerido: 30 usuários)
- [ ] **Criar landing page** para conversão comercial
  - [ ] Design responsivo
  - [ ] Formulário de contato
  - [ ] Testimonials
  - [ ] Pricing table

### Legal e Compliance
- [ ] **Revisar termos de uso** da LN Markets
- [ ] **Criar termos de serviço** da plataforma
  - [ ] Consultar advogado especializado
  - [ ] Incluir cláusulas de responsabilidade
  - [ ] Incluir política de reembolso
- [ ] **Definir política de privacidade**
  - [ ] Conformidade com GDPR
  - [ ] Política de retenção de dados
  - [ ] Direitos do usuário
- [ ] **Verificar compliance** com regulamentações locais
  - [ ] Verificar regulamentações de trading
  - [ ] Verificar regulamentações de criptomoedas
  - [ ] Verificar regulamentações de dados

## 🧪 Testes e Qualidade

### Dados de Teste
- [x] **Criar usuários de teste** com keys LN Markets válidas ✅ RESOLVIDO
- [ ] **Simular cenários** de liquidação para testar Margin Guard
  - [ ] Criar cenários de teste automatizados
  - [ ] Testar com diferentes níveis de margem
  - [ ] Validar execução de proteções
- [ ] **Criar dados históricos** para backtests
  - [ ] Exportar dados históricos da LN Markets
  - [ ] Criar datasets de teste
  - [ ] Validar algoritmos de backtest
- [ ] **Definir casos de teste** para cada automação
  - [ ] Margin Guard: diferentes níveis de risco
  - [ ] Take Profit: diferentes percentuais
  - [ ] Stop Loss: diferentes percentuais
  - [ ] Auto Entry: diferentes condições

### Performance
- [ ] **Definir SLAs** de latência (<200ms)
- [ ] **Configurar load testing** (Artillery/K6)
  - [ ] Instalar Artillery
  - [ ] Criar scripts de teste
  - [ ] Configurar métricas de performance
- [ ] **Definir métricas** de uptime (99.5% meta)
- [ ] **Configurar alertas** de performance
  - [ ] Alertas de latência alta
  - [ ] Alertas de throughput baixo
  - [ ] Alertas de erro rate alto

## 📱 Frontend e UX

### Design System
- [x] **Definir paleta de cores** e tipografia ✅ RESOLVIDO
- [x] **Criar componentes base** (botões, inputs, cards) ✅ RESOLVIDO
- [x] **Definir responsividade** (mobile-first) ✅ RESOLVIDO
- [ ] **Criar wireframes** para cada página
  - [ ] Landing page
  - [ ] Dashboard
  - [ ] Configurações
  - [ ] Relatórios
- [ ] **Criar protótipos** interativos
  - [ ] Usar Figma ou similar
  - [ ] Testar com usuários
  - [ ] Iterar baseado em feedback

### Integração
- [ ] **Configurar Vercel** ou similar para deploy frontend
  - [ ] Criar conta Vercel
  - [ ] Configurar domínio customizado
  - [ ] Configurar CI/CD
- [ ] **Configurar CI/CD** para build automático
- [ ] **Definir estratégia** de cache e CDN
  - [ ] Configurar CloudFlare
  - [ ] Configurar cache de assets
  - [ ] Configurar cache de API
- [ ] **Configurar analytics** (opcional)
  - [ ] Google Analytics
  - [ ] Hotjar para heatmaps
  - [ ] Mixpanel para eventos

## 🔒 Segurança

### Criptografia
- [ ] **Gerar chaves** de criptografia para produção
  - [ ] Gerar chaves AES-256
  - [ ] Gerar chaves JWT
  - [ ] Gerar chaves de assinatura
- [ ] **Configurar Vault** ou similar para secrets
  - [ ] Instalar HashiCorp Vault
  - [ ] Configurar políticas de acesso
  - [ ] Configurar rotação de chaves
- [ ] **Implementar rotação** de chaves
  - [ ] Configurar rotação automática
  - [ ] Configurar notificações
  - [ ] Testar processo de rotação
- [ ] **Configurar backup** de chaves críticas
  - [ ] Backup criptografado
  - [ ] Múltiplas localizações
  - [ ] Teste de restauração

### Auditoria
- [ ] **Configurar logs** de auditoria
  - [ ] Configurar log aggregation
  - [ ] Configurar log retention
  - [ ] Configurar log analysis
- [ ] **Definir retenção** de logs
  - [ ] Logs de aplicação: 30 dias
  - [ ] Logs de segurança: 1 ano
  - [ ] Logs de auditoria: 7 anos
- [ ] **Implementar alertas** de segurança
  - [ ] Alertas de login suspeito
  - [ ] Alertas de tentativas de acesso
  - [ ] Alertas de mudanças críticas
- [ ] **Configurar backup** de dados críticos
  - [ ] Backup diário automático
  - [ ] Backup criptografado
  - [ ] Teste de restauração

### Configurações de Segurança Externas
- [ ] **Configurar reCAPTCHA v3** - Obter site key e secret key do Google
- [ ] **Configurar hCaptcha** - Obter site key e secret key como fallback
- [ ] **Configurar SMTP** - Configurar servidor de email para verificação e reset de senha
- [ ] **Configurar HTTPS** - SSL/TLS no servidor (Nginx/Cloudflare)
- [ ] **Configurar dependabot** - Atualização automática de dependências
- [ ] **Configurar backup automatizado** - Backup criptografado de dados
- [ ] **Configurar OWASP ZAP** - Scanner de vulnerabilidades
- [ ] **Configurar Sentry** - Error tracking e monitoramento
- [ ] **Configurar webhook de segurança** - Alertas para Slack/Discord
- [ ] **Configurar IPs permitidos** - Whitelist para acesso admin
- [ ] **Configurar domínio admin** - Subdomínio separado para painel admin
- [ ] **Configurar Nginx** - Headers de segurança e rate limiting
- [ ] **Configurar Fail2ban** - Proteção contra brute force
- [ ] **Configurar firewall** - Regras de firewall para servidor
- [ ] **Configurar monitoramento** - Alertas de atividades suspeitas

## 📊 Marketing e Comunidade

### Conteúdo
- [ ] **Criar documentação** para usuários
  - [ ] Guia de início rápido
  - [ ] Tutoriais em vídeo
  - [ ] FAQ completo
- [ ] **Criar blog** técnico
  - [ ] Artigos sobre trading
  - [ ] Tutoriais de automação
  - [ ] Casos de uso
- [ ] **Criar vídeos** demonstrativos
  - [ ] Demo da plataforma
  - [ ] Tutoriais de configuração
  - [ ] Casos de sucesso

### Comunidade
- [ ] **Criar Discord/Telegram** para comunidade
  - [ ] Configurar servidor
  - [ ] Criar canais organizados
  - [ ] Configurar bots de moderação
- [ ] **Criar Twitter** para updates
  - [ ] Criar conta oficial
  - [ ] Configurar automação
  - [ ] Criar conteúdo regular
- [ ] **Criar GitHub** para código aberto
  - [ ] Open source de componentes
  - [ ] Documentação técnica
  - [ ] Issues e discussões

## 🚀 Deploy e Produção

### Preparação para Produção
- [ ] **Configurar ambiente** de staging
  - [ ] Ambiente idêntico à produção
  - [ ] Dados de teste realistas
  - [ ] Testes automatizados
- [ ] **Configurar ambiente** de produção
  - [ ] Servidores configurados
  - [ ] Banco de dados configurado
  - [ ] Cache configurado
- [ ] **Configurar monitoramento** de produção
  - [ ] Métricas de aplicação
  - [ ] Métricas de infraestrutura
  - [ ] Alertas configurados
- [ ] **Configurar backup** de produção
  - [ ] Backup automático
  - [ ] Teste de restauração
  - [ ] Documentação de recovery

### Go-Live
- [ ] **Plano de go-live** detalhado
  - [ ] Checklist de pré-requisitos
  - [ ] Plano de rollback
  - [ ] Equipe de suporte
- [ ] **Comunicação** com usuários
  - [ ] Email de lançamento
  - [ ] Post em redes sociais
  - [ ] Atualização de documentação
- [ ] **Monitoramento** pós-go-live
  - [ ] Monitoramento 24/7
  - [ ] Resposta rápida a problemas
  - [ ] Coleta de feedback

---

## 📋 Checklist de Dependências Críticas

### ✅ **INFRAESTRUTURA MVP (RESOLVIDA - v0.0.6)**
- ✅ **Containers Funcionando**: Todos os serviços Docker rodando
- ✅ **PostgreSQL + Redis**: Configurados e funcionais em desenvolvimento
- ✅ **Frontend + Backend**: Plataforma minimamente acessível
- ✅ **Workers**: Stubs criados para desenvolvimento
- ✅ **Scripts de Setup**: Automação completa para desenvolvimento

### Para MVP (Testers)
- [x] Conta sandbox LN Markets ✅ RESOLVIDO
- [ ] Bot Telegram configurado
- [ ] Domínio e SSL básico
- [x] Cupons de teste criados ✅ RESOLVIDO
- [ ] SMTP configurado para emails
- [ ] Monitoramento básico

### Para Comercialização
- [ ] Conta produção LN Markets
- [ ] LND/LNbits configurado
- [ ] EvolutionAPI para WhatsApp
- [ ] Monitoramento completo
- [ ] Landing page e onboarding
- [ ] Sistema de pagamentos
- [ ] Suporte ao cliente

### Para Escala
- [ ] Load balancer configurado
- [ ] CDN configurado
- [ ] Backup automatizado
- [ ] Disaster recovery
- [ ] Compliance completo
- [ ] Auditoria de segurança

---

## 📅 Cronograma de Dependências

### Semana 1-2: Infraestrutura Básica
- [ ] Configurar conta AWS
- [ ] Configurar RDS PostgreSQL
- [ ] Configurar ElastiCache Redis
- [ ] Registrar domínio
- [ ] Configurar SSL

### Semana 3-4: Integrações
- [ ] Configurar LN Markets produção
- [ ] Configurar Lightning Network
- [ ] Configurar serviços de notificação
- [ ] Configurar monitoramento

### Semana 5-6: Segurança e Compliance
- [ ] Configurar Vault
- [ ] Configurar backup
- [ ] Configurar auditoria
- [ ] Revisar compliance

### Semana 7-8: Go-Live
- [ ] Configurar ambiente de produção
- [ ] Testes finais
- [ ] Plano de go-live
- [ ] Lançamento

---

## 🎯 Prioridades

### 🔴 **CRÍTICO** (Bloqueia MVP)
- [ ] Conta produção LN Markets
- [ ] Domínio e SSL
- [ ] SMTP para emails
- [ ] Monitoramento básico

### 🟡 **IMPORTANTE** (Bloqueia Comercialização)
- [ ] Lightning Network
- [ ] Serviços de notificação
- [ ] Landing page
- [ ] Sistema de pagamentos

### 🟢 **DESEJÁVEL** (Melhoria)
- [ ] CDN
- [ ] Backup automatizado
- [ ] Compliance completo
- [ ] Suporte ao cliente

---

**Última atualização**: 2025-01-15  
**Responsável**: Founder/Dev  
**Próxima revisão**: A cada sprint ou quando houver mudanças
