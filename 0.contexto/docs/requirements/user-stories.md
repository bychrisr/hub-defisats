# User Stories

Este documento contém as user stories do hub-defisats, organizadas por funcionalidade e prioridade.

## Epic 1: Autenticação e Onboarding

### US-001: Registro de Usuário
**Como** um novo usuário  
**Eu quero** me registrar na plataforma  
**Para que** eu possa acessar as funcionalidades de automação

**Critérios de Aceitação**:
- [ ] Posso me registrar com email e senha
- [ ] Posso me registrar via login social (Google, GitHub)
- [ ] Devo fornecer keys válidas da LN Markets
- [ ] Posso usar um cupom de desconto durante o registro
- [ ] Recebo confirmação de registro bem-sucedido
- [ ] Minhas keys são criptografadas antes do armazenamento

**Prioridade**: Alta  
**Estimativa**: 5 story points

---

### US-002: Login de Usuário
**Como** um usuário registrado  
**Eu quero** fazer login na plataforma  
**Para que** eu possa acessar minha conta

**Critérios de Aceitação**:
- [ ] Posso fazer login com email e senha
- [ ] Posso fazer login via provedor social
- [ ] Recebo um token JWT válido
- [ ] Minha sessão expira após 30 minutos de inatividade
- [ ] Posso renovar minha sessão com refresh token
- [ ] Posso fazer logout de forma segura

**Prioridade**: Alta  
**Estimativa**: 3 story points

---

### US-003: Validação de Keys LN Markets
**Como** um usuário  
**Eu quero** que minhas keys LN Markets sejam validadas  
**Para que** eu tenha certeza de que funcionam corretamente

**Critérios de Aceitação**:
- [ ] As keys são validadas contra a API LN Markets
- [ ] Recebo feedback imediato sobre a validade
- [ ] Posso corrigir keys inválidas
- [ ] As keys são testadas com uma operação de leitura
- [ ] Erros de validação são claros e acionáveis

**Prioridade**: Alta  
**Estimativa**: 8 story points

## Epic 2: Automações - Margin Guard

### US-004: Configurar Margin Guard
**Como** um usuário  
**Eu quero** configurar proteção automática contra liquidação  
**Para que** eu não perca dinheiro por margem insuficiente

**Critérios de Aceitação**:
- [ ] Posso definir o threshold de margem (ex: 80%)
- [ ] Posso escolher a ação (fechar posição, adicionar margem)
- [ ] Posso ativar/desativar a automação
- [ ] Posso ver o status atual da minha margem
- [ ] A configuração é salva e aplicada imediatamente
- [ ] Posso editar a configuração a qualquer momento

**Prioridade**: Crítica  
**Estimativa**: 13 story points

---

### US-005: Monitoramento de Margem em Tempo Real
**Como** um usuário  
**Eu quero** ver minha margem atualizada em tempo real  
**Para que** eu possa tomar decisões informadas

**Critérios de Aceitação**:
- [ ] Vejo minha margem atualizada a cada 5 segundos
- [ ] Recebo alertas visuais quando a margem está baixa
- [ ] Posso ver o histórico de margem nas últimas 24h
- [ ] A atualização funciona via WebSocket
- [ ] Posso ver o status de minhas automações ativas

**Prioridade**: Crítica  
**Estimativa**: 8 story points

---

### US-006: Execução Automática de Proteção
**Como** um usuário  
**Eu quero** que a proteção seja executada automaticamente  
**Para que** eu não precise intervir manualmente

**Critérios de Aceitação**:
- [ ] A automação é executada quando o threshold é atingido
- [ ] A ordem é executada via API LN Markets
- [ ] Recebo confirmação da execução
- [ ] O log da operação é registrado
- [ ] Posso ver o resultado da execução
- [ ] Falhas são tratadas e reportadas

**Prioridade**: Crítica  
**Estimativa**: 13 story points

## Epic 3: Logs e Rastreabilidade

### US-007: Visualizar Logs de Trades
**Como** um usuário  
**Eu quero** ver o histórico completo dos meus trades  
**Para que** eu possa analisar o desempenho das automações

**Critérios de Aceitação**:
- [ ] Posso ver todos os trades executados
- [ ] Posso filtrar por data, status, automação
- [ ] Vejo claramente se foi erro da app ou da corretora
- [ ] Posso ver detalhes de cada trade
- [ ] Os logs são atualizados em tempo real
- [ ] Posso exportar os logs (futuro)

**Prioridade**: Alta  
**Estimativa**: 8 story points

---

### US-008: Distinguir Tipos de Erro
**Como** um usuário  
**Eu quero** saber se um erro foi causado pela app ou pela corretora  
**Para que** eu possa entender onde está o problema

**Critérios de Aceitação**:
- [ ] Erros são categorizados como app_error ou exchange_error
- [ ] Cada erro tem uma mensagem descritiva
- [ ] Posso ver o timestamp exato do erro
- [ ] Posso ver detalhes técnicos do erro
- [ ] Erros são agrupados por tipo para análise
- [ ] Posso reportar bugs baseado nos logs

**Prioridade**: Alta  
**Estimativa**: 5 story points

## Epic 4: Notificações e Alertas

### US-009: Configurar Notificações
**Como** um usuário  
**Eu quero** configurar como receber alertas  
**Para que** eu seja notificado sobre eventos importantes

**Critérios de Aceitação**:
- [ ] Posso configurar Telegram, Email, WhatsApp
- [ ] Posso escolher quais eventos me notificar
- [ ] Posso ativar/desativar cada canal
- [ ] Posso testar as notificações
- [ ] As configurações são salvas
- [ ] Posso editar a qualquer momento

**Prioridade**: Alta  
**Estimativa**: 8 story points

---

### US-010: Receber Alertas de Margem Crítica
**Como** um usuário  
**Eu quero** receber alertas quando minha margem está crítica  
**Para que** eu possa tomar ação imediata

**Critérios de Aceitação**:
- [ ] Recebo alerta quando margem < 90%
- [ ] Recebo alerta quando margem < 95%
- [ ] O alerta é enviado via canais configurados
- [ ] Recebo confirmação de entrega
- [ ] Posso configurar os thresholds
- [ ] Não recebo spam de alertas

**Prioridade**: Crítica  
**Estimativa**: 5 story points

---

### US-011: Receber Confirmações de Execução
**Como** um usuário  
**Eu quero** receber confirmação quando automações são executadas  
**Para que** eu saiba que minhas ordens foram processadas

**Critérios de Aceitação**:
- [ ] Recebo notificação de execução bem-sucedida
- [ ] Recebo notificação de falha na execução
- [ ] A notificação inclui detalhes da operação
- [ ] Posso ver o status no dashboard
- [ ] Notificações são enviadas imediatamente
- [ ] Posso configurar quais confirmações receber

**Prioridade**: Alta  
**Estimativa**: 5 story points

## Epic 5: Backtests

### US-012: Executar Backtest
**Como** um usuário  
**Eu quero** testar minhas automações com dados históricos  
**Para que** eu possa avaliar a eficácia antes de usar em tempo real

**Critérios de Aceitação**:
- [ ] Posso escolher o período para backtest
- [ ] Posso configurar os parâmetros da automação
- [ ] O backtest usa meu histórico pessoal de trades
- [ ] Recebo um relatório detalhado
- [ ] Posso ver trades simulados vs reais
- [ ] O resultado é salvo para consulta futura

**Prioridade**: Média  
**Estimativa**: 13 story points

---

### US-013: Visualizar Relatório de Backtest
**Como** um usuário  
**Eu quero** ver um relatório claro do backtest  
**Para que** eu possa entender o desempenho da automação

**Critérios de Aceitação**:
- [ ] Vejo métricas principais (win rate, PnL, drawdown)
- [ ] Posso ver gráficos de performance
- [ ] Posso ver lista de trades simulados
- [ ] Posso comparar com trades reais
- [ ] O relatório é fácil de entender
- [ ] Posso exportar o relatório (futuro)

**Prioridade**: Média  
**Estimativa**: 8 story points

## Epic 6: Pagamentos (Versão Comercial)

### US-014: Escolher Plano de Pagamento
**Como** um usuário  
**Eu quero** escolher um plano de pagamento  
**Para que** eu possa acessar funcionalidades avançadas

**Critérios de Aceitação**:
- [ ] Posso ver os planos disponíveis (Basic, Advanced, Pro)
- [ ] Posso ver os recursos de cada plano
- [ ] Posso ver o preço em sats
- [ ] Posso escolher o plano desejado
- [ ] O processo é claro e simples
- [ ] Posso cancelar a qualquer momento

**Prioridade**: Baixa (Fase 3)  
**Estimativa**: 5 story points

---

### US-015: Pagar com Lightning
**Como** um usuário  
**Eu quero** pagar meu plano com Lightning Network  
**Para que** eu possa usar Bitcoin de forma descentralizada

**Critérios de Aceitação**:
- [ ] Posso gerar uma invoice Lightning
- [ ] Posso pagar via transferência interna LN Markets
- [ ] Posso pagar via invoice externa
- [ ] O pagamento é validado automaticamente
- [ ] Meu plano é ativado imediatamente
- [ ] Recebo confirmação do pagamento

**Prioridade**: Baixa (Fase 3)  
**Estimativa**: 13 story points

## Epic 7: Dashboard Administrativo

### US-016: Acessar Dashboard Admin
**Como** um administrador  
**Eu quero** acessar o dashboard administrativo  
**Para que** eu possa gerenciar a plataforma

**Critérios de Aceitação**:
- [ ] Posso fazer login como superadmin
- [ ] Vejo KPIs principais (usuários, trades, receita)
- [ ] Posso navegar entre diferentes seções
- [ ] O dashboard é responsivo
- [ ] Posso ver alertas do sistema
- [ ] Tenho acesso a logs detalhados

**Prioridade**: Média  
**Estimativa**: 8 story points

---

### US-017: Gerenciar Cupons
**Como** um administrador  
**Eu quero** criar e gerenciar cupons  
**Para que** eu possa oferecer descontos e testes

**Critérios de Aceitação**:
- [ ] Posso criar novos cupons
- [ ] Posso definir limite de uso
- [ ] Posso definir data de expiração
- [ ] Posso ver estatísticas de uso
- [ ] Posso ativar/desativar cupons
- [ ] Posso ver histórico de uso

**Prioridade**: Média  
**Estimativa**: 5 story points

---

### US-018: Monitorar KPIs
**Como** um administrador  
**Eu quero** ver KPIs da plataforma  
**Para que** eu possa tomar decisões de negócio

**Critérios de Aceitação**:
- [ ] Vejo número de usuários ativos
- [ ] Vejo volume de trades processados
- [ ] Vejo taxa de sucesso das automações
- [ ] Vejo receita total em sats
- [ ] Posso filtrar por período
- [ ] Posso exportar relatórios

**Prioridade**: Média  
**Estimativa**: 8 story points

## Epic 8: Experiência do Usuário

### US-019: Interface Responsiva
**Como** um usuário  
**Eu quero** usar a plataforma em qualquer dispositivo  
**Para que** eu possa monitorar minhas posições em qualquer lugar

**Critérios de Aceitação**:
- [ ] A interface funciona bem no desktop
- [ ] A interface funciona bem no mobile
- [ ] Os gráficos são legíveis em telas pequenas
- [ ] Os botões são fáceis de tocar
- [ ] A navegação é intuitiva
- [ ] O carregamento é rápido

**Prioridade**: Alta  
**Estimativa**: 8 story points

---

### US-020: Feedback Visual
**Como** um usuário  
**Eu quero** receber feedback visual das minhas ações  
**Para que** eu saiba que o sistema está funcionando

**Critérios de Aceitação**:
- [ ] Vejo loading states durante operações
- [ ] Recebo confirmações de ações
- [ ] Vejo indicadores de status
- [ ] Erros são exibidos claramente
- [ ] Sucessos são confirmados visualmente
- [ ] A interface é responsiva às ações

**Prioridade**: Alta  
**Estimativa**: 5 story points

## Definição de Pronto (DoD)

Para cada user story ser considerada "Done", deve atender:

- [ ] Código implementado e testado
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Deploy em ambiente de teste
- [ ] Teste manual realizado
- [ ] Critérios de aceitação validados
- [ ] Performance dentro dos limites
- [ ] Segurança validada

## Priorização

### Crítica (MVP)
- US-004: Configurar Margin Guard
- US-005: Monitoramento de Margem em Tempo Real
- US-006: Execução Automática de Proteção
- US-010: Receber Alertas de Margem Crítica

### Alta (Fase 1)
- US-001: Registro de Usuário
- US-002: Login de Usuário
- US-003: Validação de Keys LN Markets
- US-007: Visualizar Logs de Trades
- US-008: Distinguir Tipos de Erro
- US-009: Configurar Notificações
- US-011: Receber Confirmações de Execução
- US-019: Interface Responsiva
- US-020: Feedback Visual

### Média (Fase 2)
- US-012: Executar Backtest
- US-013: Visualizar Relatório de Backtest
- US-016: Acessar Dashboard Admin
- US-017: Gerenciar Cupons
- US-018: Monitorar KPIs

### Baixa (Fase 3)
- US-014: Escolher Plano de Pagamento
- US-015: Pagar com Lightning
