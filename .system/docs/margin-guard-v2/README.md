# Margin Guard V2 - Documentação Completa

> **Status**: Active  
> **Última Atualização**: 2025-01-12  
> **Versão**: 2.0.0  
> **Responsável**: Sistema de Automação Axisor  

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Quick Start Guide](#quick-start-guide)
- [Documentação Técnica](#documentação-técnica)
- [Guias Práticos](#guias-práticos)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O **Margin Guard V2** é uma automação avançada de proteção contra liquidação que monitora posições em tempo real via WebSocket e adiciona margem automaticamente quando o preço se aproxima do nível de liquidação.

### ✨ Principais Recursos

- **Monitoramento em Tempo Real**: Via WebSocket da LN Markets (não polling)
- **Modos Flexíveis**: Unitário (posições específicas) ou Global (todas as posições)
- **Cálculo Preciso**: Inclui todas as taxas da LN Markets
- **Preview em Tempo Real**: Simulação antes de executar
- **Sistema de Planos**: Limitações baseadas no plano do usuário
- **Notificações Centralizadas**: In-app, push, e futuramente outros canais
- **Central de Reports**: Transparência total das execuções

### 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   LN Markets    │
│                 │    │                  │    │                 │
│ • Config UI     │◄──►│ • Worker V2      │◄──►│ • WebSocket     │
│ • Preview       │    │ • Notifications  │    │ • API           │
│ • Reports       │    │ • Plan Limits    │    │ • Positions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start Guide

### 1. Configuração Básica

1. Acesse **Automations** → **Margin Guard**
2. Configure o **Limite de Margem** (% de distância para acionar)
3. Configure o **% de Margem** a adicionar
4. Escolha o **Modo**: Unitário ou Global

### 2. Modo Unitário

- Selecione posições específicas para monitorar
- Configurações aplicadas apenas às posições selecionadas
- Disponível em planos Advanced+

### 3. Modo Global

- Monitora todas as posições running
- Configurações aplicadas globalmente
- Disponível em todos os planos

### 4. Preview e Ativação

- Visualize o cálculo em tempo real
- Verifique taxas e custos
- Ative a automação

## 📚 Documentação Técnica

### Implementação Interna
- [01 - Arquitetura](./internal-implementation/01-architecture.md)
- [02 - Boas Práticas](./internal-implementation/02-best-practices.md)
- [03 - Guia de Migração](./internal-implementation/03-migration-guide.md)
- [04 - Troubleshooting](./internal-implementation/04-troubleshooting.md)
- [05 - Exemplos Práticos](./internal-implementation/05-examples.md)

### Fórmulas e Cálculos
- [01 - Cálculo de Distância](./formulas/01-distance-calculation.md)
- [02 - Margem com Taxas](./formulas/02-margin-with-fees.md)

### Diagramas
- [01 - Arquitetura do Sistema](./diagrams/01-architecture-diagram.md)
- [02 - Fluxo WebSocket](./diagrams/02-websocket-flow.md)
- [03 - Fluxo de Execução](./diagrams/03-execution-flow.md)

## 🔧 Guias Práticos

### Por Plano de Usuário

#### 🆓 Free
- Máximo 2 posições
- Apenas modo global
- Configurações básicas

#### 🔹 Basic
- Todas as posições
- Apenas modo global
- Configurações padrão

#### 🔸 Advanced
- Modo unitário ou global
- Configurações avançadas
- Preview detalhado

#### 🔶 Pro/Lifetime
- Modo unitário e global
- Configurações individuais por posição
- Todas as funcionalidades

### Configurações Recomendadas

#### Mercado Volátil
- Limite: 15-20%
- Margem: 25-30%

#### Mercado Estável
- Limite: 10-15%
- Margem: 20-25%

## ⚠️ Limitações e Disclaimers

### Importante
- **Margin Guard não garante proteção** contra liquidação em mercados extremamente voláteis
- **Taxas da LN Markets** aplicam-se a cada execução
- **Certifique-se** de ter saldo suficiente para cobrir margem + taxas
- **Limite de 1 execução** por segundo (API LN Markets)

### Segurança
- Dados de mercado têm cache máximo de 30s
- Nunca usamos dados antigos
- Sempre validamos timestamp
- Seguimos [Volatile Market Safety](./_VOLATILE_MARKET_SAFETY.md)

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte o [Troubleshooting](./internal-implementation/04-troubleshooting.md)
2. Verifique os [Exemplos](./internal-implementation/05-examples.md)
3. Entre em contato com o suporte técnico

---

**Última atualização**: 2025-01-12  
**Versão da documentação**: 2.0.0
