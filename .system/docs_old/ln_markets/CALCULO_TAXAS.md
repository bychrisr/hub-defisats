# 📑 Documentação Técnica: Sistema de Taxas da LN Markets (v2) - Cálculos Avançados

> **Público-Alvo:** Desenvolvedores Sêniores integrando aplicações com a API da LN Markets.
> **Objetivo:** Entender profundamente a lógica das taxas de negociação e funding, com instruções práticas para calcular:
> 1.  **Estimativa de taxas futuras** (abertura + fechamento + funding) para posições `running`.
> 2.  **Total de taxas já pagas** para posições `closed`.

---

## 1. Visão Geral dos Tipos de Taxas

A LN Markets cobra dois tipos principais de taxas:

1.  **Taxas de Negociação (Trading Fees):**
    *   Cobradas na **abertura** e **fechamento** de uma posição (futures ou opções).
    *   São **tier-based** (baseadas no volume de 30 dias).
    *   O valor é cobrado diretamente da margem (`maintenance_margin`).

2.  **Taxas de Funding (Funding Fees):**
    *   Cobradas **a cada 8 horas** (00:00, 08:00, 16:00 UTC) em posições de futures perpétuos abertas.
    *   São um mecanismo de alinhamento de preço entre o contrato e o mercado spot.
    *   Podem ser **pagas** (se a posição for long e a taxa for positiva) ou **recebidas** (se a posição for short e a taxa for positiva).
    *   O valor é deduzido da margem da posição se o usuário estiver pagando, ou adicionado ao saldo geral se estiver recebendo.

---

## 2. Estrutura de Tiers para Taxas de Negociação

| Tier | Volume Acumulado (30 dias) | Taxa de Negociação |
| :--- | :------------------------: | :----------------: |
| 1    |            $0              |       0.10%        |
| 2    |         > $250,000         |       0.08%        |
| 3    |        > $1,000,000        |       0.07%        |
| 4    |        > $5,000,000        |       0.06%        |

*   O `fee_tier` do usuário pode ser obtido via endpoint `GET /v2/user`.
*   A taxa efetiva aplicada em uma operação depende do `fee_tier` do usuário **no momento exato da execução da operação** (abertura ou fechamento).

---

## 3. Cálculo de Taxas de Negociação (Trading Fees)

### 3.1. Mecanismo de Reserva e Cobrança (Futures)

O sistema usa um modelo de **reserva inicial** seguido por **cobrança real**.

#### Fluxo de Cálculo

1.  **Na Criação da Ordem (Reserva Inicial):**
    *   O sistema calcula duas reservas na `maintenance_margin` usando sempre a **taxa do Tier 1 (0.1%)**.
    *   **`opening_fee_reserved` = `(quantity / entry_price) * 0.001 * 100_000_000`**
    *   **`closing_fee_reserved` = `(quantity / initial_liquidation_price) * 0.001 * 100_000_000`**
    *   `maintenance_margin_initial = opening_fee_reserved + closing_fee_reserved`

2.  **Na Execução da Abertura (Cobrança Real da Abertura):**
    *   A taxa de abertura real é cobrada com base no `fee_tier` do usuário no momento.
    *   **`opening_fee_paid` = `(quantity / entry_price) * user_actual_fee_rate * 100_000_000`**
    *   `maintenance_margin_after_opening = maintenance_margin_initial - opening_fee_paid`

3.  **No Fechamento da Posição (Cobrança Real do Fechamento):**
    *   A taxa de fechamento real é cobrada com base no `fee_tier` do usuário no momento do fechamento.
    *   **`closing_fee_paid` = `(quantity / exit_price) * user_actual_fee_rate * 100_000_000`**
    *   `maintenance_margin_final = maintenance_margin_after_opening - closing_fee_paid`
    *   O total pago é `opening_fee_paid + closing_fee_paid`.

### 3.2. Cálculo de Taxas para Opções

As opções têm uma **taxa fixa de 0.05%** (0.0005), cobrada na abertura.

*   **`option_trading_fee` = `margin_paid` * 0.0005**
*   O valor `margin_paid` é o total pago pelo usuário ao abrir a opção (premium + maintenance margin), em sats.

---

## 4. Cálculo de Taxas de Funding (Funding Fees)

### 4.1. Conceito e Frequência

*   Aplicadas a cada 8 horas (00:00, 08:00, 16:00 UTC) em **posições de futures perpétuos abertas**.
*   O valor é determinado pela **taxa de funding rate** (agregada de múltiplas exchanges).
*   **Positiva (`+`):** Longs pagam, Shorts recebem.
*   **Negativa (`-`):** Longs recebem, Shorts pagam.

### 4.2. Cálculo do Valor da Taxa para o Usuário

```python
funding_fee_in_sats = (position_quantity / index_price_at_funding) * funding_rate * 100_000_000
```

*   `position_quantity`: Valor nominal da posição em USD.
*   `index_price_at_funding`: Preço do índice (BTCUSD) no momento do evento de funding.
*   `funding_rate`: Taxa de funding (ex: 0.0001 para 0.01%).

### 4.3. Impacto na API

*   **Débito/Crédito:** O valor é **deduzido diretamente da margem (`margin`) da posição** se o usuário estiver pagando. Se estiver recebendo, o valor é **adicionado ao saldo geral (`balance`)**.
*   **Histórico:** Todas as taxas de funding pagas/recebidas são registradas e podem ser consultadas via `GET /v2/futures/carry-fees-history`.

---

## 5. Cálculo de Estimativas de Taxas Futuras (Posições Running)

Para calcular a **estimativa total de taxas que você pagará** em todas as suas posições ativas, você precisa somar três componentes:

### 5.1. Estimativa de Taxas de Abertura e Fechamento

Para cada posição `running`, calcule a estimativa de taxas de negociação baseada no seu `fee_tier` atual.

```python
def calculate_estimated_trading_fees(position, current_user_fee_rate):
    """
    Calcula a estimativa de taxas de negociação (abertura + fechamento) para uma posição.
    
    Args:
        position: Objeto de posição com campos 'quantity', 'entry_price', 'initial_liquidation_price'
        current_user_fee_rate: Taxa de negociação atual do usuário (ex: 0.0008 para 0.08%)

    Returns:
        dict: { 'opening': sats, 'closing': sats, 'total': sats }
    """
    # Estimativa de abertura (usando a taxa atual)
    opening_fee_estimated = (position['quantity'] / position['entry_price']) * current_user_fee_rate * 100_000_000
    
    # Estimativa de fechamento (usando a taxa atual e o preço de liquidação inicial)
    closing_fee_estimated = (position['quantity'] / position['initial_liquidation_price']) * current_user_fee_rate * 100_000_000
    
    return {
        'opening': int(opening_fee_estimated),
        'closing': int(closing_fee_estimated),
        'total': int(opening_fee_estimated + closing_fee_estimated)
    }
```

### 5.2. Estimativa de Taxas de Funding Futuras

Este cálculo é **vivo** e deve ser atualizado com frequência (por exemplo, a cada hora). Você precisa monitorar a **taxa de funding rate** e o **preço do índice**.

```python
def calculate_estimated_future_funding_fee(position, current_funding_rate, current_index_price):
    """
    Calcula a estimativa de uma única taxa de funding para uma posição.
    
    Args:
        position: Objeto de posição com campo 'quantity'
        current_funding_rate: Taxa de funding atual (ex: 0.0001 para 0.01%)
        current_index_price: Preço do índice atual (BTCUSD)

    Returns:
        int: Valor estimado da taxa de funding em sats (positivo se o usuário paga, negativo se recebe)
    """
    fee_sats = (position['quantity'] / current_index_price) * current_funding_rate * 100_000_000
    return int(fee_sats)
```

### 5.3. Cálculo Total Estimado para Todas as Posições Running

```python
def calculate_total_estimated_fees_running(orders_running, current_user_fee_rate, current_funding_rate, current_index_price):
    """
    Calcula o total estimado de taxas para todas as posições running.
    
    Args:
        orders_running: Lista de objetos de posição com status 'running'
        current_user_fee_rate: Taxa de negociação atual do usuário
        current_funding_rate: Taxa de funding atual
        current_index_price: Preço do índice atual

    Returns:
        dict: Dicionário com totais estimados
    """
    total_trading_fees = {'opening': 0, 'closing': 0, 'total': 0}
    total_funding_fees = 0
    
    for order in orders_running:
        # Cálculo de taxas de negociação
        trading_fees = calculate_estimated_trading_fees(order, current_user_fee_rate)
        total_trading_fees['opening'] += trading_fees['opening']
        total_trading_fees['closing'] += trading_fees['closing']
        total_trading_fees['total'] += trading_fees['total']
        
        # Cálculo de taxa de funding (para futures)
        if order['type'] == 'm':  # Only futures
            funding_fee = calculate_estimated_future_funding_fee(order, current_funding_rate, current_index_price)
            total_funding_fees += funding_fee
    
    return {
        'trading': total_trading_fees,
        'funding': total_funding_fees,
        'total_estimated': total_trading_fees['total'] + total_funding_fees
    }
```

---

## 6. Cálculo do Total de Taxas Pagas (Posições Closed)

Para calcular o **total de taxas já pagas** em todas as posições fechadas, você precisa somar os valores de `opening_fee` e `closing_fee` de cada posição `closed`.

```python
def calculate_total_paid_fees_closed(orders_closed):
    """
    Calcula o total de taxas pagas em todas as posições closed.
    
    Args:
        orders_closed: Lista de objetos de posição com status 'closed'

    Returns:
        int: Total de taxas pagas em sats
    """
    total_paid = 0
    
    for order in orders_closed:
        # Somar a taxa de abertura e fechamento
        total_paid += order['opening_fee'] + order['closing_fee']
        
        # Somar as taxas de funding pagas (negativas)
        if order['sum_carry_fees'] < 0:
            total_paid += abs(order['sum_carry_fees'])
    
    return total_paid
```

---

## 7. Obtenção de Dados Necessários via API

Para implementar os cálculos acima, você precisará fazer as seguintes chamadas à API:

1.  **Obter o `fee_tier` do usuário:**
    ```bash
    GET /v2/user
    ```
    *   Campo relevante: `fee_tier`

2.  **Obter a taxa de funding rate e o preço do índice:**
    ```bash
    GET /v2/futures/ticker
    ```
    *   Campos relevantes: `carryFeeRate`, `index`

3.  **Obter todas as posições (running e closed):**
    ```bash
    GET /v2/futures/trades?type=running
    GET /v2/futures/trades?type=closed
    ```

4.  **Obter o histórico de taxas de funding pagas/recebidas:**
    ```bash
    GET /v2/futures/carry-fees-history?from=...&to=...
    ```
    *   Útil para reconciliação, mas não necessário para o cálculo total, pois `sum_carry_fees` já está disponível nas posições fechadas.

---

## 8. Exemplo Prático de Uso

```python
import requests

# Configurações
API_BASE_URL = "https://api.lnmarkets.com/v2"
API_KEY = "your_api_key"
SECRET_KEY = "your_secret_key"

# Função para autenticar requisições
def create_signature(timestamp, method, path, params):
    # Implementação do HMAC SHA256 conforme descrito no documento
    pass

# Obter dados necessários
user_response = requests.get(f"{API_BASE_URL}/user", headers={"LNM-ACCESS-KEY": API_KEY})
user_data = user_response.json()
current_user_fee_rate = get_fee_rate_from_tier(user_data["fee_tier"])  # Função personalizada

ticker_response = requests.get(f"{API_BASE_URL}/futures/ticker")
ticker_data = ticker_response.json()
current_funding_rate = ticker_data["carryFeeRate"]
current_index_price = ticker_data["index"]

# Obter posições
running_positions = requests.get(f"{API_BASE_URL}/futures/trades?type=running").json()
closed_positions = requests.get(f"{API_BASE_URL}/futures/trades?type=closed").json()

# Calcular estimativas para posições running
estimated_fees_running = calculate_total_estimated_fees_running(
    running_positions,
    current_user_fee_rate,
    current_funding_rate,
    current_index_price
)

# Calcular total pago para posições closed
total_paid_fees_closed = calculate_total_paid_fees_closed(closed_positions)

print(f"Estimativa de taxas futuras (running): {estimated_fees_running['total_estimated']} sats")
print(f"Total de taxas pagas (closed): {total_paid_fees_closed} sats")
```

---

## 9. Considerações Finais

*   **Precisão:** As estimativas de taxas de negociação são apenas isso — estimativas. O valor real dependerá do `fee_tier` do usuário no momento da execução da ordem de fechamento.
*   **Funding Vivo:** O cálculo de funding é dinâmico. Para obter uma estimativa precisa, você deve atualizar os valores de `funding_rate` e `index_price` com frequência.
*   **Reconciliação:** Use o endpoint `/v2/futures/carry-fees-history` para conciliar o saldo da conta com o histórico de funding.
*   **Boas Práticas:** Armazene o `fee_tier` do usuário em cache, mas atualize-o periodicamente. Implemente polling ou WebSocket para monitorar mudanças no `carryFeeRate` e `index`.