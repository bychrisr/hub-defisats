# User Exchange Accounts - Documentation Index

> **Status**: Active  
> **Última Atualização**: 2025-01-14  
> **Versão**: 1.0.0  
> **Responsável**: User Exchange Accounts System  

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Migração do Sistema Antigo](#migração-do-sistema-antigo)
- [Segurança e Criptografia](#segurança-e-criptografia)
- [Exemplos Práticos](#exemplos-práticos)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

## Visão Geral

Sistema de gerenciamento de contas de exchange para usuários, permitindo múltiplas contas por usuário, por exchange, com credenciais criptografadas e validação de segurança. Substitui o sistema antigo de credenciais diretas na tabela `User`.

## Arquitetura

- [Arquitetura do Sistema](./internal-implementation/01-architecture.md)
- [Melhores Práticas](./internal-implementation/02-best-practices.md)
- [Guia de Migração](./internal-implementation/03-migration-guide.md)
- [Troubleshooting](./internal-implementation/04-troubleshooting.md)
- [Exemplos Práticos](./internal-implementation/05-examples.md)

## Diagramas

- [Diagrama de Arquitetura](./diagrams/01-architecture-diagram.md)
- [Fluxo de Criptografia](./diagrams/02-encryption-flow.md)
- [Fluxo de Migração](./diagrams/03-migration-flow.md)

## Referências

- [Código Fonte](../../../backend/src/services/userExchangeAccount.service.ts)
- [Schema Prisma](../../../backend/prisma/schema.prisma)
- [Account Credentials Service](../../../backend/src/services/account-credentials.service.ts)
- [Auth Service](../../../backend/src/services/auth.service.ts)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
