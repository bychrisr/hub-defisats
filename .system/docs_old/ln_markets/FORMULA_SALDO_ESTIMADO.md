## ✅ Fórmula do Saldo Estimado do Usuário

```python
saldo_estimado = (
    saldo_disponivel_atual
    + soma_dos_saldos_estimados_das_posicoes_running
    - soma_das_taxas_estimadas_para_fechamento_das_posicoes
    - soma_das_taxas_de_funding_estimadas_para_as_proximas_24h
)
```

---

## 🧮 Componentes Detalhados

### 1. `saldo_disponivel_atual`
Obtido diretamente do endpoint `GET /v2/user`.

```json
{
  "balance": 69420 // em sats
}
```

> **Este é o saldo livre para novas operações ou saques.**

---

### 2. `soma_dos_saldos_estimados_das_posicoes_running`

Para cada posição com `running: true`, o valor estimado que retornará ao saldo ao ser fechada é:

```python
saldo_estimado_posicao = (
    trade["margin"]          # margem alocada à posição
    + trade["pl"]            # P&L não realizado (pode ser negativo)
    + trade["maintenance_margin"]  # margem de manutenção restante (inclui reserva de fechamento)
)
```

> ⚠️ **Importante:** Esse valor **não é líquido de taxas**. As taxas de fechamento e funding ainda precisam ser deduzidas.

---

### 3. `soma_das_taxas_estimadas_para_fechamento_das_posicoes`

Para cada posição `running`, calcule a **taxa de fechamento estimada** com base no `fee_tier` atual do usuário.

```python
def calcular_taxa_fechamento_estimada(trade, fee_rate_atual):
    """
    Calcula a taxa de fechamento estimada em sats.
    """
    # Usa o preço atual do mercado (último preço) como proxy para o preço de fechamento
    preco_fechamento_estimado = obter_preco_atual_mercado()  # via GET /v2/futures/ticker → lastPrice

    taxa_fechamento = (trade["quantity"] / preco_fechamento_estimado) * fee_rate_atual * 100_000_000
    return int(taxa_fechamento)
```

> 📌 **Nota:** A LN Markets reserva a taxa de fechamento com base no Tier 1 (0.1%) e no preço de liquidação inicial, mas o valor real será baseado no `fee_tier` no momento do fechamento e no preço real de fechamento. Para uma estimativa conservadora, use o `lastPrice` atual.

---

### 4. `soma_das_taxas_de_funding_estimadas_para_as_proximas_24h`

As taxas de funding são aplicadas a cada 8h (00:00, 08:00, 16:00 UTC). Em 24h, ocorrem **3 eventos de funding**.

Para cada posição `running`:

```python
def calcular_funding_estimado_24h(trade, funding_rate_atual, preco_index_atual):
    """
    Calcula o funding total estimado para as próximas 24h (3 eventos).
    """
    # Calcula o funding para UM evento
    funding_por_evento = (trade["quantity"] / preco_index_atual) * funding_rate_atual * 100_000_000

    # Se for LONG e funding_rate > 0 → usuário PAGA → valor positivo (custo)
    # Se for SHORT e funding_rate > 0 → usuário RECEBE → valor negativo (ganho)
    # Se for LONG e funding_rate < 0 → usuário RECEBE → valor negativo
    # Se for SHORT e funding_rate < 0 → usuário PAGA → valor positivo

    if trade["side"] == "b":  # Long
        funding_24h = 3 * abs(funding_por_evento) if funding_rate_atual > 0 else 3 * (-abs(funding_por_evento))
    else:  # Short
        funding_24h = 3 * (-abs(funding_por_evento)) if funding_rate_atual > 0 else 3 * abs(funding_por_evento)

    return int(funding_24h)
```

> 📌 **Fonte dos dados:**
> - `funding_rate_atual`: `GET /v2/futures/ticker` → campo `carryFeeRate`
> - `preco_index_atual`: `GET /v2/futures/ticker` → campo `index`

---

## 📊 Exemplo Prático de Cálculo

Suponha:

- `saldo_disponivel_atual = 50.000 sats`
- 1 posição running LONG:
  - `margin = 10.000 sats`
  - `pl = +500 sats`
  - `maintenance_margin = 200 sats`
  - `quantity = $100`
  - `side = "b"`
- `lastPrice = $60.000`
- `index = $60.000`
- `carryFeeRate = +0.0001` (0.01%)
- `fee_tier = 2` → `fee_rate = 0.0008`

**Cálculos:**

1. **Saldo das posições:**
   `10.000 + 500 + 200 = 10.700 sats`

2. **Taxa de fechamento estimada:**
   `(100 / 60.000) * 0.0008 * 100.000.000 = 133 sats`

3. **Funding estimado (24h):**
   - Por evento: `(100 / 60.000) * 0.0001 * 100.000.000 = 17 sats`
   - Como é LONG e funding positivo: paga 17 sats por evento → `3 * 17 = 51 sats`

4. **Saldo Estimado Total:**
   `50.000 + 10.700 - 133 - 51 = 60.516 sats`

---

## 🧩 Código de Exemplo (Python)

```python
import requests

API_URL = "https://api.lnmarkets.com/v2"

def get_user_data(api_key, secret_key):
    headers = montar_headers("GET", "/user", "", api_key, secret_key)
    response = requests.get(f"{API_URL}/user", headers=headers)
    return response.json()

def get_running_trades(api_key, secret_key):
    headers = montar_headers("GET", "/futures/trades?type=running", "type=running", api_key, secret_key)
    response = requests.get(f"{API_URL}/futures/trades?type=running", headers=headers)
    return response.json()

def get_ticker(api_key, secret_key):
    headers = montar_headers("GET", "/futures/ticker", "", api_key, secret_key)
    response = requests.get(f"{API_URL}/futures/ticker", headers=headers)
    return response.json()

def get_fee_rate_from_tier(fee_tier):
    tiers = {0: 0.001, 1: 0.0008, 2: 0.0007, 3: 0.0006}
    return tiers.get(fee_tier, 0.001)

def calcular_saldo_estimado(api_key, secret_key):
    # Obter dados
    user_data = get_user_data(api_key, secret_key)
    running_trades = get_running_trades(api_key, secret_key)
    ticker_data = get_ticker(api_key, secret_key)

    saldo_disponivel = user_data["balance"]
    fee_rate_atual = get_fee_rate_from_tier(user_data["fee_tier"])
    funding_rate = ticker_data["carryFeeRate"]
    preco_index = ticker_data["index"]
    last_price = ticker_data["lastPrice"]

    soma_saldos_posicoes = 0
    soma_taxas_fechamento = 0
    soma_funding_24h = 0

    for trade in running_trades:
        # Saldo estimado da posição (antes de taxas)
        saldo_posicao = trade["margin"] + trade["pl"] + trade["maintenance_margin"]
        soma_saldos_posicoes += saldo_posicao

        # Taxa de fechamento estimada
        taxa_fechamento = (trade["quantity"] / last_price) * fee_rate_atual * 100_000_000
        soma_taxas_fechamento += int(taxa_fechamento)

        # Funding estimado para 24h (3 eventos)
        funding_por_evento = (trade["quantity"] / preco_index) * funding_rate * 100_000_000
        if trade["side"] == "b":  # Long
            funding_total = 3 * funding_por_evento if funding_rate > 0 else 3 * (-funding_por_evento)
        else:  # Short
            funding_total = 3 * (-funding_por_evento) if funding_rate > 0 else 3 * funding_por_evento
        soma_funding_24h += int(funding_total)

    saldo_estimado = (
        saldo_disponivel
        + soma_saldos_posicoes
        - soma_taxas_fechamento
        - soma_funding_24h
    )

    return {
        "saldo_disponivel": saldo_disponivel,
        "valor_em_posicoes": soma_saldos_posicoes,
        "taxas_fechamento_estimadas": soma_taxas_fechamento,
        "funding_24h_estimado": soma_funding_24h,
        "saldo_estimado_total": saldo_estimado
    }
```

---

## ⚠️ Considerações Importantes

- **Volatilidade do Funding:** A taxa de funding muda a cada 8h. Para estimativas de longo prazo, considere usar a média histórica (via `GET /v2/futures/fixing-history`).
- **Preço de Fechamento:** Usar o `lastPrice` atual é uma aproximação. O preço real pode variar.
- **Mudança de Tier:** Se o usuário está próximo de subir de tier, a estimativa pode ser otimista. Para segurança, calcule com o tier atual e também com o tier inferior.
- **Liquidação:** Este cálculo assume que as posições **não serão liquidadas**. Se houver risco de liquidação, o saldo estimado pode ser drasticamente menor.

---

## ✅ Conclusão

O **Saldo Estimado** mais preciso na LN Markets é:

> **Saldo Disponível + Valor Líquido das Posições Abertas - Custos Futuros (Fechamento + Funding)**

Essa abordagem fornece uma visão realista do capital total do usuário, considerando todos os ativos e passivos financeiros na plataforma, e é essencial para aplicações de gestão de risco, dashboards e robôs de trading.