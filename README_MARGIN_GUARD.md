# Margin Guard - Automação de Proteção de Margem

## Visão Geral

O Margin Guard é uma automação avançada que protege suas posições de trading contra liquidações inesperadas. Ele monitora continuamente o nível de margem das suas posições ativas e executa ações automáticas quando o limite configurado é atingido.

## Funcionalidades

### 🔍 Monitoramento Contínuo
- Monitora todas as posições ativas a cada 30 segundos
- Calcula a razão de margem em tempo real
- Identifica alertas de aviso e críticos

### ⚡ Ações Automáticas
- **Fechar Posição**: Fecha automaticamente a posição quando o limite crítico é atingido
- **Reduzir Posição**: Reduz o tamanho da posição por uma porcentagem configurada
- **Adicionar Margem**: Adiciona margem adicional para manter a posição

### 📱 Notificações
- Alertas via email, Telegram ou webhook
- Notificações para alertas de aviso e críticos
- Logs detalhados de todas as ações executadas

## Como Configurar

### 1. Acesse a Página do Margin Guard

1. Faça login na plataforma
2. Navegue para a seção "Margin Guard" no menu
3. Clique em "Editar" para configurar suas preferências

### 2. Configure os Parâmetros

#### Limite de Margem (Threshold)
- Valor em porcentagem (ex: 20 = 20%)
- Quando a margem cair abaixo deste valor, ações são executadas
- Recomendado: 15-25% dependendo do seu perfil de risco

#### Ação Automática
- **Fechar Posição**: Mais segura, evita perdas maiores
- **Reduzir Posição**: Mantém exposição parcial ao mercado
- **Adicionar Margem**: Mais arriscada, aumenta exposição

#### Configurações Específicas
- **Porcentagem de Redução**: Para ação "Reduzir Posição" (ex: 50%)
- **Margem Adicional**: Para ação "Adicionar Margem" (em sats)

### 3. Ative as Notificações (Opcional)

1. Configure seus canais de notificação preferidos
2. Escolha quais tipos de alertas receber
3. Teste as notificações

## Como Funciona

### Processo de Monitoramento

1. **Coleta de Dados**: Busca posições ativas da LN Markets
2. **Cálculo de Margem**: Calcula a razão de margem para cada posição
3. **Avaliação de Risco**: Compara com o limite configurado
4. **Ação Automática**: Executa a ação configurada se necessário
5. **Notificação**: Envia alertas para o usuário
6. **Log**: Registra todas as ações no banco de dados

### Fórmula de Cálculo

```
Razão de Margem = Margem de Manutenção / (Margem + P&L)
```

- **Margem de Manutenção**: Valor mínimo necessário para manter a posição
- **Margem**: Margem depositada na posição
- **P&L**: Lucro/Prejuízo não realizado

### Níveis de Alerta

- **Seguro**: Razão > 80% do limite configurado
- **Aviso**: Razão entre 80% e 100% do limite
- **Crítico**: Razão ≤ limite configurado (ação executada)

## Iniciando os Workers

Para que o Margin Guard funcione completamente, você precisa iniciar os workers:

### Desenvolvimento (Docker Compose)

```bash
# Iniciar apenas os workers
docker-compose --profile workers up -d

# Ou iniciar tudo incluindo workers
docker-compose --profile workers up -d postgres redis backend frontend
```

### Desenvolvimento (Local)

```bash
# No diretório backend
npm run workers:start-all
```

### Produção

```bash
# Iniciar workers individualmente
npm run worker:margin-monitor:prod
npm run worker:automation-executor:prod
npm run worker:notification:prod
```

## Monitoramento e Logs

### Logs dos Workers

Os workers geram logs detalhados que podem ser monitorados:

```bash
# Margin Monitor
tail -f logs/margin-monitor.log

# Automation Executor
tail -f logs/automation-executor.log

# Notifications
tail -f logs/notification.log
```

### Dashboard de Automação

1. Acesse a página do Margin Guard
2. Visualize o status atual
3. Veja histórico de ações executadas
4. Monitore alertas recentes

## Segurança e Limitações

### ⚠️ Avisos Importantes

1. **Monitoramento Contínuo**: O sistema não substitui o monitoramento manual
2. **Condições de Mercado**: Eventos extremos podem afetar a execução
3. **Limites de API**: Respeita os limites da API da LN Markets
4. **Responsabilidade**: O usuário é responsável pelas configurações

### 🛡️ Medidas de Segurança

- Validação rigorosa de todas as configurações
- Logs detalhados de todas as ações
- Notificações de falhas
- Circuit breakers para evitar loops

## Solução de Problemas

### Margin Guard Não Está Funcionando

1. **Verifique Status dos Workers**:
   ```bash
   docker-compose ps
   ```

2. **Verifique Logs**:
   ```bash
   docker-compose logs margin-monitor
   ```

3. **Verifique Configuração**:
   - Confirme que o Margin Guard está ativado
   - Verifique se há posições ativas
   - Valide as credenciais da LN Markets

### Notificações Não Chegam

1. **Verifique Configuração de Notificação**:
   - Confirme que as notificações estão ativadas
   - Valide as configurações dos canais

2. **Verifique Worker de Notificação**:
   ```bash
   docker-compose logs notification-worker
   ```

### Ações Não São Executadas

1. **Verifique Limite de Margem**:
   - Confirme que a margem está abaixo do limite
   - Verifique se há posições qualificadas

2. **Verifique Logs do Executor**:
   ```bash
   docker-compose logs automation-executor
   ```

## Suporte

Para suporte técnico ou dúvidas sobre o Margin Guard:

1. Verifique os logs dos workers
2. Consulte a documentação da LN Markets API
3. Entre em contato com o suporte técnico

## Changelog

### v1.0.0 - Funcionalidades Básicas
- ✅ Monitoramento contínuo de margem
- ✅ Ações automáticas (fechar, reduzir, adicionar margem)
- ✅ Sistema de notificações
- ✅ Interface de configuração
- ✅ Logs e histórico de ações
