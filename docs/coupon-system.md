# Sistema de Cupons - Hub DeFiSats

## Visão Geral

O sistema de cupons do Hub DeFiSats foi projetado para oferecer flexibilidade máxima na criação de descontos e promoções. Cada cupom possui 3 variáveis principais que determinam seu comportamento.

## Estrutura dos Cupons

### 1. **Tempo** (`time_type`)
- **`fixed`**: Tempo fixo em dias (ex: 5 dias, 30 dias)
- **`lifetime`**: Acesso vitalício ao plano

### 2. **Valor** (`value_type`)
- **`fixed`**: Valor fixo em sats (ex: 1.000 sats de desconto)
- **`percentage`**: Percentual de desconto (ex: 10% de desconto)

### 3. **Funcionalidade** (`plan_type`)
- **`free`**: Plano gratuito
- **`basic`**: Plano básico
- **`advanced`**: Plano avançado
- **`pro`**: Plano profissional
- **`lifetime`**: Plano vitalício (novo)

## Campos do Banco de Dados

```sql
model Coupon {
  id           String       @id @default(dbgenerated("(gen_random_uuid())::text"))
  code         String       @unique
  usage_limit  Int?         @default(1)
  used_count   Int?         @default(0)
  plan_type    String       // free, basic, advanced, pro, lifetime
  expires_at   DateTime?    @db.Timestamp(6)
  
  // Novos campos para o sistema de cupons
  value_type   String       // 'fixed' ou 'percentage'
  value_amount Int          // Valor fixo em sats ou percentual (1-100)
  time_type    String       // 'fixed' ou 'lifetime'
  time_days    Int?         // Número de dias (apenas se time_type = 'fixed')
  
  created_at   DateTime     @default(now()) @db.Timestamp(6)
  user_coupons UserCoupon[] @relation("CouponUserRelation")
}
```

## Validações Implementadas

### Validação de Valor
- **Tipo `fixed`**: Valor deve estar entre 1 e 1.000.000 sats
- **Tipo `percentage`**: Valor deve estar entre 1 e 100%

### Validação de Tempo
- **Tipo `fixed`**: `time_days` é obrigatório e deve estar entre 1 e 3650 dias
- **Tipo `lifetime`**: `time_days` deve ser `null`

### Validação de Código
- Deve conter apenas letras maiúsculas, números, hífens e underscores
- Tamanho entre 3 e 50 caracteres
- Deve ser único no sistema

## Exemplos de Uso

### Cupom de Desconto Fixo por 30 dias
```json
{
  "code": "WELCOME2024",
  "plan_type": "basic",
  "value_type": "fixed",
  "value_amount": 1000,
  "time_type": "fixed",
  "time_days": 30,
  "usage_limit": 100
}
```

### Cupom de Desconto Percentual Vitalício
```json
{
  "code": "LIFETIME50",
  "plan_type": "lifetime",
  "value_type": "percentage",
  "value_amount": 50,
  "time_type": "lifetime",
  "usage_limit": 10
}
```

### Cupom de Acesso Gratuito por 7 dias
```json
{
  "code": "TRIAL7DAYS",
  "plan_type": "advanced",
  "value_type": "fixed",
  "value_amount": 0,
  "time_type": "fixed",
  "time_days": 7,
  "usage_limit": 1000
}
```

## Interface de Administração

A interface de administração foi atualizada para incluir:

1. **Seleção de Tipo de Valor**: Dropdown para escolher entre "Valor Fixo" e "Percentual"
2. **Campo de Valor**: Input numérico com validação baseada no tipo selecionado
3. **Seleção de Tipo de Tempo**: Dropdown para escolher entre "Tempo Fixo" e "Vitalício"
4. **Campo de Duração**: Input numérico para dias (apenas quando tipo = "fixed")
5. **Plano Lifetime**: Nova opção no dropdown de planos

## Tabela de Cupons

A tabela de cupons agora exibe:
- **Código**: Código do cupom
- **Plano**: Tipo de plano (incluindo "LIFETIME")
- **Valor**: Valor do desconto (sats ou %)
- **Tempo**: Duração ou "Vitalício"
- **Usage**: Uso atual vs limite
- **Status**: Ativo, Expirado, ou Totalmente Usado
- **Expires**: Data de expiração
- **Created**: Data de criação
- **Recent Usage**: Histórico de uso

## API Endpoints

### Criar Cupom
```http
POST /api/admin/coupons
Content-Type: application/json
Authorization: Bearer <token>

{
  "code": "WELCOME2024",
  "plan_type": "basic",
  "value_type": "fixed",
  "value_amount": 1000,
  "time_type": "fixed",
  "time_days": 30,
  "usage_limit": 100,
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Listar Cupons
```http
GET /api/admin/coupons
Authorization: Bearer <token>
```

### Buscar Cupom por Código
```http
GET /api/admin/coupons/{code}
Authorization: Bearer <token>
```

## Considerações de Segurança

1. **Validação Server-Side**: Todas as validações são implementadas no backend
2. **Rate Limiting**: Implementar rate limiting para criação de cupons
3. **Audit Log**: Registrar todas as operações de cupons
4. **Expiração**: Cupons expiram automaticamente baseado na data ou uso

## Próximos Passos

1. **Migração do Banco**: Executar migração para adicionar novos campos
2. **Testes**: Implementar testes unitários e de integração
3. **Documentação da API**: Atualizar documentação OpenAPI/Swagger
4. **Monitoramento**: Implementar métricas de uso de cupons
5. **Relatórios**: Criar relatórios de eficácia dos cupons
