# Pendências Externas (Owner Tasks)

Este documento registra tarefas que dependem de ações externas ao desenvolvimento, como configurações de infraestrutura, integrações com serviços terceiros, ou decisões de negócio.

## 🔑 Integrações e APIs

### LN Markets API
- [ ] **Configurar conta sandbox** para testes de desenvolvimento
- [ ] **Obter credenciais de produção** para deploy inicial
- [ ] **Validar rate limits** e documentar limites por endpoint
- [ ] **Testar webhooks** (se disponíveis) para notificações em tempo real

### Lightning Network
- [ ] **Configurar LND node** ou **LNbits** para pagamentos externos
- [ ] **Definir preços em sats** para planos (Basic, Advanced, Pro)
- [ ] **Configurar webhook** para validação automática de pagamentos
- [ ] **Testar invoices** em ambiente de desenvolvimento

### Serviços de Notificação
- [ ] **Criar bot Telegram** para notificações
- [ ] **Configurar EvolutionAPI** para WhatsApp
- [ ] **Configurar SMTP** para emails (Gmail/SendGrid)
- [ ] **Definir templates** de mensagens para cada tipo de alerta

## 🏗️ Infraestrutura

### AWS/Cloud Provider
- [ ] **Configurar conta AWS** ou provider alternativo
- [ ] **Configurar RDS PostgreSQL** para produção
- [ ] **Configurar ElastiCache Redis** para cache e filas
- [ ] **Configurar EKS** ou similar para Kubernetes
- [ ] **Configurar Load Balancer** e SSL/TLS

### Domínio e SSL
- [ ] **Registrar domínio** para produção
- [ ] **Configurar DNS** (A records, CNAME)
- [ ] **Configurar Certbot** para SSL automático
- [ ] **Configurar Nginx** como reverse proxy

### Monitoramento
- [ ] **Configurar Prometheus + Grafana** para métricas
- [ ] **Configurar Sentry** para error tracking
- [ ] **Configurar ELK Stack** para logs centralizados
- [ ] **Definir alertas** para métricas críticas

## 💰 Negócio e Monetização

### Planos e Preços
- [ ] **Definir preços finais** em sats para cada plano
- [ ] **Criar cupons de teste** para testers iniciais
- [ ] **Definir limite de testers** (sugerido: 30 usuários)
- [ ] **Criar landing page** para conversão comercial

### Legal e Compliance
- [ ] **Revisar termos de uso** da LN Markets
- [ ] **Criar termos de serviço** da plataforma
- [ ] **Definir política de privacidade**
- [ ] **Verificar compliance** com regulamentações locais

## 🧪 Testes e Qualidade

### Dados de Teste
- [ ] **Criar usuários de teste** com keys LN Markets válidas
- [ ] **Simular cenários** de liquidação para testar Margin Guard
- [ ] **Criar dados históricos** para backtests
- [ ] **Definir casos de teste** para cada automação

### Performance
- [ ] **Definir SLAs** de latência (<200ms)
- [ ] **Configurar load testing** (Artillery/K6)
- [ ] **Definir métricas** de uptime (99.5% meta)
- [ ] **Configurar alertas** de performance

## 📱 Frontend e UX

### Design System
- [ ] **Definir paleta de cores** e tipografia
- [ ] **Criar componentes base** (botões, inputs, cards)
- [ ] **Definir responsividade** (mobile-first)
- [ ] **Criar wireframes** para cada página

### Integração
- [ ] **Configurar Vercel** ou similar para deploy frontend
- [ ] **Configurar CI/CD** para build automático
- [ ] **Definir estratégia** de cache e CDN
- [ ] **Configurar analytics** (opcional)

## 🔒 Segurança

### Criptografia
- [ ] **Gerar chaves** de criptografia para produção
- [ ] **Configurar Vault** ou similar para secrets
- [ ] **Implementar rotação** de chaves
- [ ] **Configurar backup** de chaves críticas

### Auditoria
- [ ] **Configurar logs** de auditoria
- [ ] **Definir retenção** de logs
- [ ] **Implementar alertas** de segurança
- [ ] **Configurar backup** de dados críticos

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

---

## 📋 Checklist de Dependências Críticas

### ✅ **INFRAESTRUTURA MVP (RESOLVIDA - v0.0.6)**
- ✅ **Containers Funcionando**: Todos os serviços Docker rodando
- ✅ **PostgreSQL + Redis**: Configurados e funcionais em desenvolvimento
- ✅ **Frontend + Backend**: Plataforma minimamente acessível
- ✅ **Workers**: Stubs criados para desenvolvimento
- ✅ **Scripts de Setup**: Automação completa para desenvolvimento

### Para MVP (Testers)
- [ ] Conta sandbox LN Markets
- [ ] Bot Telegram configurado
- [ ] Domínio e SSL básico
- [ ] Cupons de teste criados

### Para Comercialização
- [ ] Conta produção LN Markets
- [ ] LND/LNbits configurado
- [ ] EvolutionAPI para WhatsApp
- [ ] Monitoramento completo
- [ ] Landing page e onboarding

---

**Última atualização**: 2024-01-XX  
**Responsável**: Founder/Dev  
**Próxima revisão**: A cada sprint ou quando houver mudanças
