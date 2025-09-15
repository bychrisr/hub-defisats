# 🌐 Guia Completo de Internacionalização (i18n)

## 📋 Visão Geral

Este documento apresenta o sistema completo de internacionalização implementado no Hub DefiSats, incluindo suporte a múltiplos idiomas e conversão inteligente de moedas.

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Idiomas
- **Suporte completo** a português brasileiro (PT-BR) e inglês americano (EN-US)
- **Detecção automática** baseada no navegador do usuário
- **Persistência inteligente** de preferências no localStorage
- **Mudança instantânea** sem recarregar a página

### ✅ Sistema de Moedas
- **Conversão em tempo real** entre BTC, USD, BRL, EUR e sats
- **APIs externas** integradas (CoinGecko + ExchangeRate)
- **Cache inteligente** com atualização automática
- **Fallback robusto** para funcionamento offline

### ✅ Interface Multilíngue
- **Seletor integrado** no header da aplicação
- **Página de configurações** dedicada
- **Conversor de moeda** completo
- **Feedback visual** em tempo real

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos

```
frontend/src/
├── i18n/
│   ├── index.ts                 # Configuração principal do i18n
│   └── locales/
│       ├── pt-BR.json          # Dicionário português
│       └── en-US.json          # Dicionário inglês
├── hooks/
│   ├── useTranslation.ts       # Hook para traduções
│   ├── useCurrency.ts          # Hook para câmbio
│   └── useSmartFormat.ts       # Hook para formatação
├── services/
│   └── currency.service.ts      # Serviço de conversão
└── components/
    ├── common/
    │   ├── LanguageCurrencySelector.tsx    # Seletor dual
    │   ├── CurrencyConverter.tsx           # Conversor completo
    │   └── InternationalizationDemo.tsx    # Demonstração
    └── layout/
        └── Header.tsx                      # Integração no header
```

### Bibliotecas Utilizadas

```json
{
  "react-i18next": "^13.5.0",
  "i18next": "^23.7.6",
  "i18next-browser-languagedetector": "^7.2.0"
}
```

## 🚀 Como Usar

### 1. Traduções Básicas

```typescript
import { useTranslation } from '@/hooks/useTranslation';

const MyComponent = () => {
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.loading')}</p>

      <button onClick={() => changeLanguage('en-US')}>
        {t('settings.language')}
      </button>

      <p>Idioma atual: {getCurrentLanguage()}</p>
    </div>
  );
};
```

### 2. Conversão de Moedas

```typescript
import { useCurrency } from '@/hooks/useCurrency';

const PriceDisplay = () => {
  const { convert, format, supportedCurrencies } = useCurrency();

  // Conversão simples
  const conversion = convert(1000, 'BRL', 'USD');

  return (
    <div>
      <div>Valor convertido: {conversion.formatted}</div>
      <div>Taxa de câmbio: {conversion.rate}</div>
      <div>Última atualização: {new Date(conversion.timestamp).toLocaleTimeString()}</div>
    </div>
  );
};
```

### 3. Formatação Inteligente

```typescript
import { useSmartFormat } from '@/hooks/useSmartFormat';

const TradingMetrics = ({ pnl, volume, timestamp, sats }) => {
  const {
    formatValue,
    formatPercentage,
    formatDate,
    formatSats,
    formatPnL,
    formatNumber,
    formatStatus
  } = useSmartFormat();

  return (
    <div className="metrics">
      <div>P&L: {formatPnL(pnl)}</div>
      <div>Volume: {formatValue(volume)}</div>
      <div>Data: {formatDate(timestamp)}</div>
      <div>Satoshis: {formatSats(sats)}</div>
      <div>Status: {formatStatus('active')}</div>
      <div>Número grande: {formatNumber(1500000)}</div>
    </div>
  );
};
```

## 📚 Dicionário de Traduções

### Estrutura dos Arquivos JSON

```json
{
  "namespace": {
    "key": "valor traduzido",
    "nested": {
      "key": "valor aninhado"
    }
  }
}
```

### Chaves Principais Disponíveis

#### Interface Geral
```json
{
  "common": {
    "loading": "Carregando...",
    "error": "Erro",
    "success": "Sucesso",
    "cancel": "Cancelar",
    "save": "Salvar"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "automations": "Automações",
    "backtests": "Backtests"
  }
}
```

#### Dashboard
```json
{
  "dashboard": {
    "title": "Dashboard",
    "estimated_balance": "Saldo Estimado",
    "total_invested": "Total Investido",
    "total_profit": "Lucro Total",
    "success_rate": "Taxa de Sucesso"
  }
}
```

#### Sistema de Moedas
```json
{
  "currency": {
    "usd": "USD",
    "brl": "BRL",
    "btc": "BTC",
    "sats": "sats",
    "convert_to": "Converter para",
    "exchange_rate": "Taxa de Câmbio"
  }
}
```

## 💱 Sistema de Conversão de Moedas

### Moedas Suportadas

| Moeda | Símbolo | Tipo | Descrição |
|-------|---------|------|-----------|
| BTC | ₿ | Cripto | Bitcoin |
| USD | $ | Fiat | Dólar americano |
| BRL | R$ | Fiat | Real brasileiro |
| EUR | € | Fiat | Euro |
| sats | sats | Cripto | Satoshis |

### APIs Integradas

#### CoinGecko API
```javascript
// Endpoint utilizado
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd

// Resposta
{
  "bitcoin": {
    "usd": 45000
  }
}
```

#### ExchangeRate API
```javascript
// Endpoint utilizado
GET https://api.exchangerate-api.com/v4/latest/USD

// Resposta
{
  "rates": {
    "BRL": 5.0,
    "EUR": 0.85,
    "GBP": 0.73
  }
}
```

### Cache e Performance

- **Duração do cache**: 5 minutos
- **Atualização automática**: Em background
- **Fallback offline**: Valores padrão configurados
- **Limite de requisições**: Respeita limites das APIs

## 🎨 Componentes da Interface

### LanguageCurrencySelector

Componente principal para seleção de idioma e moeda:

```typescript
import { LanguageCurrencySelector } from '@/components/common/LanguageCurrencySelector';

// Uso básico
<LanguageCurrencySelector />

// Com configurações
<LanguageCurrencySelector
  variant="settings"
  showLabels={true}
  compact={false}
/>
```

### CurrencyConverter

Conversor completo de moedas:

```typescript
import { CurrencyConverter } from '@/components/common/CurrencyConverter';

// Conversor completo
<CurrencyConverter
  initialValue={1000}
  initialFrom="BRL"
  initialTo="USD"
  showHistory={true}
  compact={false}
/>
```

### InternationalizationDemo

Página de demonstração do sistema:

```typescript
import { InternationalizationDemo } from '@/components/common/InternationalizationDemo';

// Demonstração completa
<InternationalizationDemo />
```

## ⚙️ Configuração Avançada

### Configuração do i18next

```typescript
// frontend/src/i18n/index.ts
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'hub-defisats-language',
      caches: ['localStorage'],
    },
  });
```

### Configuração do Serviço de Moedas

```typescript
// Cache duration (5 minutes)
private readonly CACHE_DURATION = 5 * 60 * 1000;

// Supported currencies
private supportedCurrencies = ['BTC', 'USD', 'BRL', 'EUR', 'sats'];

// API endpoints
private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
private readonly EXCHANGERATE_API = 'https://api.exchangerate-api.com/v4';
```

## 🧪 Testes e Debugging

### Verificação de Traduções

```typescript
// Verificar se uma chave existe
const { t, i18n } = useTranslation();

// Verificar idioma atual
console.log('Current language:', i18n.language);

// Verificar se chave existe
console.log('Key exists:', i18n.exists('dashboard.title'));

// Listar idiomas disponíveis
console.log('Available languages:', i18n.languages);
```

### Debug do Sistema de Moedas

```typescript
// Verificar status do cache
const { isCacheExpired, lastUpdate, rates } = useCurrency();

console.log('Cache expired:', isCacheExpired());
console.log('Last update:', lastUpdate);
console.log('Current rates:', rates);
```

## 🚀 Exemplos Práticos

### Exemplo 1: Dashboard Multilíngue

```typescript
import { useTranslation } from '@/hooks/useTranslation';
import { useSmartFormat } from '@/hooks/useSmartFormat';

const Dashboard = () => {
  const { t } = useTranslation();
  const { formatValue, formatPnL } = useSmartFormat();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>

      <div className="metrics">
        <div>{t('dashboard.estimated_balance')}: {formatValue(balance)}</div>
        <div>{t('dashboard.total_profit')}: {formatPnL(profit)}</div>
      </div>

      <button>{t('common.refresh')}</button>
    </div>
  );
};
```

### Exemplo 2: Conversor de Trading

```typescript
import { useCurrency } from '@/hooks/useCurrency';

const TradingCalculator = () => {
  const { convert, format } = useCurrency();
  const [amount, setAmount] = useState(1000);
  const [from, setFrom] = useState('BRL');
  const [to, setTo] = useState('BTC');

  const result = convert(amount, from, to);

  return (
    <div className="calculator">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <select value={from} onChange={(e) => setFrom(e.target.value)}>
        <option value="BRL">BRL</option>
        <option value="USD">USD</option>
        <option value="BTC">BTC</option>
      </select>

      <span>→</span>

      <select value={to} onChange={(e) => setTo(e.target.value)}>
        <option value="BTC">BTC</option>
        <option value="USD">USD</option>
        <option value="BRL">BRL</option>
      </select>

      <div className="result">
        <strong>{result.formatted}</strong>
        <small>Taxa: {result.rate.toFixed(6)}</small>
      </div>
    </div>
  );
};
```

## 📋 Checklist de Implementação

### ✅ Sistema de Idiomas
- [x] Configuração do i18next
- [x] Dicionários PT-BR e EN-US
- [x] Detecção automática de idioma
- [x] Persistência de preferências
- [x] Hook useTranslation
- [x] Componente LanguageCurrencySelector

### ✅ Sistema de Moedas
- [x] Serviço de conversão
- [x] Integração com APIs externas
- [x] Cache inteligente
- [x] Fallback offline
- [x] Hook useCurrency
- [x] Formatação inteligente

### ✅ Interface do Usuário
- [x] Seletor no header
- [x] Página de configurações
- [x] Conversor de moeda
- [x] Demonstração interativa
- [x] Feedback visual
- [x] Interface responsiva

### ✅ Documentação
- [x] Guia de uso completo
- [x] Exemplos práticos
- [x] Configuração avançada
- [x] Troubleshooting

## 🔧 Manutenção e Expansão

### Adicionando Novos Idiomas

1. Criar arquivo de tradução em `frontend/src/i18n/locales/`
2. Adicionar recursos no `index.ts`
3. Atualizar componente `LanguageCurrencySelector`
4. Testar traduções

### Adicionando Novas Moedas

1. Atualizar lista em `currency.service.ts`
2. Adicionar formatação específica se necessário
3. Atualizar componente `CurrencyConverter`
4. Testar conversões

### Atualizando Traduções

1. Modificar arquivos JSON nos locales
2. Verificar consistência entre idiomas
3. Testar todas as chaves utilizadas
4. Atualizar documentação se necessário

## 📞 Suporte e Troubleshooting

### Problemas Comuns

**Traduções não aparecem:**
- Verificar se a chave existe nos arquivos JSON
- Confirmar se o namespace está correto
- Verificar se o idioma está carregado

**Conversões de moeda falham:**
- Verificar conexão com APIs externas
- Confirmar se o cache está funcionando
- Verificar valores de fallback

**Idioma não persiste:**
- Verificar localStorage
- Confirmar configuração do i18next
- Verificar detecção automática

### Debug Tools

```typescript
// Debug i18n
const { i18n } = useTranslation();
console.log('Language:', i18n.language);
console.log('Available languages:', i18n.languages);
console.log('Key exists:', i18n.exists('key.path'));

// Debug currency
const { rates, lastUpdate, isCacheExpired } = useCurrency();
console.log('Rates:', rates);
console.log('Last update:', lastUpdate);
console.log('Cache expired:', isCacheExpired());
```

---

## 🎯 Conclusão

O sistema de internacionalização implementado oferece uma solução completa e robusta para suporte a múltiplos idiomas e conversões de moeda em tempo real. Com arquitetura modular, performance otimizada e interface intuitiva, está preparado para escalar e atender às necessidades de usuários globais.

Para dúvidas ou sugestões, consulte a documentação técnica ou entre em contato com a equipe de desenvolvimento.
