# Sistema de Simulações em Tempo Real

## Visão Geral

O sistema de simulações permite testar suas automações de trading em cenários de mercado realistas antes de aplicá-las em contas reais. Execute simulações personalizadas com diferentes tipos de mercado e avalie o desempenho das suas estratégias.

## Funcionalidades Principais

### 🎯 Cenários de Mercado Disponíveis

#### Bull Market (🐂 Mercado em Alta)
- **Tendência**: Positiva e consistente
- **Volatilidade**: Baixa (0.1-0.3% por passo)
- **Ideal para**: Testar Take Profit e Trailing Stop
- **Características**: Movimentos suaves para cima com pequenas correções

#### Bear Market (🐻 Mercado em Queda)
- **Tendência**: Negativa consistente
- **Volatilidade**: Média (0.2-0.4% por passo)
- **Ideal para**: Testar Margin Guard
- **Características**: Quedas controladas com momentos de recuperação

#### Sideways (➡️ Mercado Lateral)
- **Tendência**: Neutra, sem direção definida
- **Volatilidade**: Baixa-média
- **Ideal para**: Testar resistência a range
- **Características**: Movimentos aleatórios sem tendência clara

#### Volatile (⚡ Mercado Volátil)
- **Tendência**: Altamente imprevisível
- **Volatilidade**: Alta (até 2% por passo)
- **Ideal para**: Testar automações em condições extremas
- **Características**: Eventos extremos e gaps de preço

### 🤖 Automações Suportadas

#### Margin Guard
- **Gatilho**: Margem abaixo do threshold configurado
- **Ações**: Fechar posição, reduzir posição, adicionar margem
- **Cenário Ideal**: Bear Market
- **Objetivo**: Proteger contra perdas excessivas

#### Take Profit
- **Gatilho**: Preço sobe acima do limite configurado
- **Ações**: Fechar posição com lucro
- **Cenário Ideal**: Bull Market
- **Objetivo**: Capturar lucros automaticamente

#### Trailing Stop
- **Gatilho**: Movimento de preço acima do limite
- **Ações**: Ajustar stop loss dinamicamente
- **Cenário Ideal**: Volatile Market
- **Objetivo**: Seguir tendência com proteção

#### Auto Entry
- **Gatilho**: Sinais técnicos (RSI oversold)
- **Ações**: Entrar em posições automaticamente
- **Cenário Ideal**: Sideways Market
- **Objetivo**: Entrar em posições baseadas em sinais

## Como Usar

### 1. Configurando uma Simulação

#### Interface Web
1. Acesse a página "Simulations" no menu lateral
2. Clique em "Nova Simulação"
3. Preencha os parâmetros:
   - **Nome**: Identificador descritivo
   - **Tipo de Automação**: Margin Guard, Take Profit, etc.
   - **Cenário de Preço**: Bull, Bear, Sideways, Volatile
   - **Preço Inicial**: Ponto de partida (ex: 50000 USD)
   - **Duração**: Tempo em segundos (10-3600s)

#### API REST
```bash
POST /api/simulations
{
  "name": "Teste Margin Guard Bear",
  "automationType": "margin_guard",
  "priceScenario": "bear",
  "initialPrice": 50000,
  "duration": 60,
  "environment": "testnet"
}
```

### 2. Executando a Simulação

#### Interface Web
1. Na lista de simulações, clique em "Executar"
2. Acompanhe o progresso em tempo real
3. Visualize métricas atualizadas

#### API REST
```bash
POST /api/simulations/{id}/start
```

### 3. Acompanhando em Tempo Real

Durante a execução, você verá:
- **Progresso**: Barra de progresso (0-100%)
- **Preço Atual**: Evolução do preço em tempo real
- **Status**: Criado → Executando → Concluído
- **Tempo Restante**: Contagem regressiva

### 4. Analisando Resultados

Após a conclusão, acesse:
- **Gráfico de Preços**: Evolução completa do preço
- **Gráfico P&L**: Performance da conta
- **Pontos de Ação**: Quando a automação foi acionada
- **Métricas Detalhadas**: Taxa de sucesso, tempo de resposta, etc.

## API Endpoints

### Simulações

#### `POST /api/simulations`
Criar nova simulação
```json
{
  "name": "string",
  "automationType": "margin_guard|take_profit|trailing_stop|auto_entry",
  "priceScenario": "bull|bear|sideways|volatile",
  "initialPrice": "number",
  "duration": "number (10-3600)",
  "accountId": "string (optional)",
  "environment": "string (default: testnet)"
}
```

#### `GET /api/simulations`
Listar simulações do usuário
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "automation_type": "string",
      "price_scenario": "string",
      "status": "created|running|completed|failed",
      "created_at": "datetime"
    }
  ]
}
```

#### `GET /api/simulations/{id}`
Obter detalhes de uma simulação específica

#### `POST /api/simulations/{id}/start`
Iniciar execução da simulação

#### `GET /api/simulations/{id}/progress`
Obter progresso em tempo real
```json
{
  "success": true,
  "data": {
    "simulationId": "uuid",
    "status": "running",
    "progress": 75.5,
    "currentPrice": 51234.56,
    "started_at": "datetime"
  }
}
```

#### `GET /api/simulations/{id}/metrics`
Obter métricas finais
```json
{
  "success": true,
  "data": {
    "simulationId": "uuid",
    "metrics": {
      "successRate": 85.5,
      "totalActions": 12,
      "averageResponseTime": 150,
      "totalPnL": 1250.75,
      "maxDrawdown": -450.25,
      "finalBalance": 10250.75
    }
  }
}
```

#### `GET /api/simulations/{id}/chart`
Obter dados para gráficos
```json
{
  "success": true,
  "data": {
    "priceData": [
      {"timestamp": "datetime", "price": 50000}
    ],
    "pnlData": [
      {"timestamp": "datetime", "pnl": 0, "accountBalance": 100000}
    ],
    "actions": [
      {"timestamp": "datetime", "action": "close_position", "price": 48500}
    ]
  }
}
```

#### `DELETE /api/simulations/{id}`
Deletar simulação (apenas se não estiver executando)

## Arquitetura Técnica

### Componentes

#### Backend
- **SimulationService**: Gerencia cenários de preço e lógica de automação
- **SimulationController**: API endpoints e validações
- **SimulationExecutor**: Worker que executa simulações em tempo real
- **Database Models**: Simulation e SimulationResult

#### Frontend
- **Simulation Page**: Interface principal de configuração
- **SimulationChart**: Componente de visualização de dados
- **Real-time Updates**: Polling para acompanhar progresso

### Workers

#### `simulation-executor`
- Processa simulações na fila Redis
- Executa lógica de automação passo a passo
- Salva resultados em tempo real
- Suporta até 2 simulações simultâneas

### Cenários de Preço

Cada cenário usa algoritmos diferentes:

```typescript
// Bull Market: tendência positiva + baixa volatilidade
currentPrice += initialPrice * (0.001 + random * 0.002);

// Bear Market: tendência negativa + média volatilidade
currentPrice += initialPrice * (-0.002 + random * 0.003);

// Sideways: sem tendência + volatilidade baixa
currentPrice += initialPrice * random * 0.005;

// Volatile: alta volatilidade + eventos extremos
if (extremeEvent) {
  currentPrice += initialPrice * random * 0.05;
} else {
  currentPrice += initialPrice * random * 0.01;
}
```

## Limites e Restrições

### Configurações
- **Duração**: 10-3600 segundos
- **Preço Inicial**: Qualquer valor positivo
- **Simulações Simultâneas**: Máximo 2 por usuário
- **Workers**: Limitado por recursos Redis

### Performance
- **Resolução Temporal**: 100ms por passo
- **Dados Salvos**: A cada 1 segundo (10 passos)
- **Memória**: Dados mantidos em Redis durante execução
- **Timeout**: Máximo 1 hora por simulação

## Troubleshooting

### Simulação Não Inicia
1. Verificar se worker `simulation-executor` está rodando
2. Checar logs do Redis/Queue
3. Confirmar configuração da simulação

### Dados Não Aparecem
1. Verificar se simulação foi salva no banco
2. Checar progresso via API `/progress`
3. Confirmar permissões do usuário

### Gráficos Vazios
1. Aguardar conclusão da simulação
2. Verificar se há dados em `SimulationResult`
3. Checar configuração do frontend

### Performance Lenta
1. Reduzir duração da simulação
2. Verificar carga do servidor
3. Confirmar limites do Redis

## Desenvolvimento

### Executando Workers
```bash
# Todos os workers
npm run workers:start-all

# Apenas simulação
npm run worker:simulation-executor
```

### Testando Cenários
```bash
# Simulação rápida para teste
curl -X POST /api/simulations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Quick",
    "automationType": "margin_guard",
    "priceScenario": "bull",
    "initialPrice": 50000,
    "duration": 10
  }'
```

### Monitoramento
- Logs em tempo real via console dos workers
- Métricas do Redis para performance
- Dados salvos no banco para análise posterior

## Próximas Funcionalidades

### Melhorias Planejadas
- [ ] Suporte a múltiplas moedas
- [ ] Cenários customizáveis pelo usuário
- [ ] Integração com dados históricos reais
- [ ] Análise comparativa entre cenários
- [ ] Exportação de resultados em PDF/CSV
- [ ] Templates de simulação pré-configurados
- [ ] Simulações em tempo real com dados de mercado

---

**Sistema de Simulações v1.0.0** - Teste suas automações com confiança!
