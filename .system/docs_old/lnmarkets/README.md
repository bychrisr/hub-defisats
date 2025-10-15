# LN Markets Integration Documentation

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Estrutura da Documentação](#estrutura-da-documentação)
- [Acesso Rápido](#acesso-rápido)
- [Histórico de Refatoração](#histórico-de-refatoração)

## Visão Geral

Esta documentação cobre a integração completa com a LN Markets API v2, incluindo arquitetura, autenticação, endpoints, implementação interna e fórmulas de cálculo.

A integração foi completamente refatorada para uma arquitetura centralizada e modular, garantindo maior confiabilidade e manutenibilidade.

## Estrutura da Documentação

### 📡 [external-api/](./external-api/)
Documentação da API externa da LN Markets:
- [01-overview.md](./external-api/01-overview.md) - Visão geral da API
- [02-authentication.md](./external-api/02-authentication.md) - Autenticação HMAC SHA256
- [03-endpoints.md](./external-api/03-endpoints.md) - Todos os endpoints disponíveis
- [04-rate-limits.md](./external-api/04-rate-limits.md) - Limites e throttling

### 🏗️ [internal-implementation/](./internal-implementation/)
Nossa implementação da integração:
- [01-architecture.md](./internal-implementation/01-architecture.md) - Arquitetura LNMarketsAPIv2
- [02-best-practices.md](./internal-implementation/02-best-practices.md) - Guia de boas práticas
- [03-migration-guide.md](./internal-implementation/03-migration-guide.md) - Migração da v1 para v2
- [04-troubleshooting.md](./internal-implementation/04-troubleshooting.md) - Resolução de problemas
- [05-examples.md](./internal-implementation/05-examples.md) - Exemplos práticos de uso

### 🧮 [formulas/](./formulas/)
Fórmulas e cálculos específicos:
- [01-balance-calculations.md](./formulas/01-balance-calculations.md) - Cálculos de saldo
- [02-fee-calculations.md](./formulas/02-fee-calculations.md) - Cálculo de taxas
- [03-position-calculations.md](./formulas/03-position-calculations.md) - Cálculos de posições

### 📊 [diagrams/](./diagrams/)
Diagramas e fluxogramas:
- [01-architecture-diagram.md](./diagrams/01-architecture-diagram.md) - Diagrama de arquitetura
- [02-data-flow.md](./diagrams/02-data-flow.md) - Fluxo de dados

## Acesso Rápido

### Para Desenvolvedores
- [Migração v1 → v2](./internal-implementation/03-migration-guide.md)
- [Exemplos de Uso](./internal-implementation/05-examples.md)
- [Troubleshooting](./internal-implementation/04-troubleshooting.md)

### Para Arquitetos
- [Arquitetura Completa](./internal-implementation/01-architecture.md)
- [Diagramas](./diagrams/01-architecture-diagram.md)

### Para Testes
- [Testes com Credenciais Reais](./internal-implementation/05-examples.md#testes-com-credenciais-reais)

## Histórico de Refatoração

Ver [HISTORY.md](./HISTORY.md) para histórico completo de mudanças.

### Principais Milestones

- **v1.0** - Implementação inicial com LNMarketsAPIService
- **v2.0** - Refatoração completa para LNMarketsAPIv2 (2025-01-09)
  - Arquitetura centralizada
  - Separação por domínios (user, futures, market)
  - Autenticação corrigida (base64 encoding)
  - Error handling robusto
  - Documentação completa

## Referências

- [Código Fonte: LNMarketsAPIv2](../../../backend/src/services/lnmarkets/)
- [Testes: LN Markets v2](../../../backend/src/services/lnmarkets/tests/)
- [Dashboard Integration](../../../backend/src/services/dashboard-data.service.ts)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
