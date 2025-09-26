export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  source: string;
}

export interface CurrencyRates {
  BTC: number;
  USD: number;
  BRL: number;
  EUR: number;
  sats: number;
}

export interface ConversionResult {
  value: number;
  formatted: string;
  rate: number;
  timestamp: number;
  source: string;
}

class CurrencyService {
  private rates: Map<string, CurrencyRate> = new Map();
  private cache: Map<string, CurrencyRates> = new Map();
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Bitcoin price in USD (main reference)
  private btcPrice: number = 0;

  // Exchange rates (to USD)
  private exchangeRates: { [key: string]: number } = {
    BRL: 0,
    EUR: 0,
    GBP: 0,
    JPY: 0,
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.updateRates();
    // Update rates every 5 minutes
    setInterval(() => this.updateRates(), this.CACHE_DURATION);
  }

  async updateRates(): Promise<void> {
    try {
      console.log('Updating currency rates...');

      // Fetch BTC price from backend (evita CORS) - usar fetch direto para evitar problemas com Axios
      const btcResponse = await fetch('/api/market/index/public');

      if (btcResponse.ok) {
        const result = await btcResponse.json();
        if (result.success && result.data) {
          this.btcPrice = result.data.index;
        }
      }

      // Fetch exchange rates
      const exchangeResponse = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );

      if (exchangeResponse.ok) {
        const exchangeData = await exchangeResponse.json();
        this.exchangeRates = {
          BRL: exchangeData.rates.BRL,
          EUR: exchangeData.rates.EUR,
          GBP: exchangeData.rates.GBP,
          JPY: exchangeData.rates.JPY,
        };
      }

      // Fallback values in case APIs fail
      if (this.btcPrice === 0) {
        this.btcPrice = 45000; // Fallback BTC price
      }

      if (this.exchangeRates.BRL === 0) {
        this.exchangeRates = {
          BRL: 5.0,
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110.0,
        };
      }

      this.lastUpdate = Date.now();
      console.log('Currency rates updated successfully');

    } catch (error) {
      console.error('Error updating currency rates:', error);
      // Use fallback values
      this.btcPrice = 45000;
      this.exchangeRates = {
        BRL: 5.0,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
      };
    }
  }

  getCurrentRates(): CurrencyRates {
    return {
      BTC: this.btcPrice,
      USD: 1,
      BRL: this.exchangeRates.BRL,
      EUR: this.exchangeRates.EUR,
      sats: this.btcPrice / 100000000, // 1 sat = 1/100000000 BTC
    };
  }

  convert(value: number, from: string, to: string): ConversionResult {
    const rates = this.getCurrentRates();

    // Normalize currencies
    const normalizedFrom = this.normalizeCurrency(from);
    const normalizedTo = this.normalizeCurrency(to);

    let convertedValue = value;

    // Convert to USD first (intermediate step)
    if (normalizedFrom !== 'USD') {
      switch (normalizedFrom) {
        case 'BTC':
          convertedValue = value * rates.BTC;
          break;
        case 'BRL':
          convertedValue = value / rates.BRL;
          break;
        case 'EUR':
          convertedValue = value / rates.EUR;
          break;
        case 'sats':
          convertedValue = (value / 100000000) * rates.BTC;
          break;
        default:
          convertedValue = value;
      }
    }

    // Convert from USD to target currency
    if (normalizedTo !== 'USD') {
      switch (normalizedTo) {
        case 'BTC':
          convertedValue = convertedValue / rates.BTC;
          break;
        case 'BRL':
          convertedValue = convertedValue * rates.BRL;
          break;
        case 'EUR':
          convertedValue = convertedValue * rates.EUR;
          break;
        case 'sats':
          convertedValue = (convertedValue / rates.BTC) * 100000000;
          break;
        default:
          // Keep as is
      }
    }

    // Calculate exchange rate
    const rate = normalizedFrom === normalizedTo ? 1 : (convertedValue / value);

    return {
      value: convertedValue,
      formatted: this.formatCurrency(convertedValue, normalizedTo),
      rate,
      timestamp: this.lastUpdate,
      source: 'live',
    };
  }

  private normalizeCurrency(currency: string): string {
    const normalized = currency.toUpperCase();

    switch (normalized) {
      case 'SAT':
      case 'SATOSHI':
      case 'SATOSHIS':
        return 'sats';
      case 'BR':
      case 'REAL':
      case 'REAIS':
        return 'BRL';
      case 'US':
      case '$':
        return 'USD';
      case 'EURO':
      case '€':
        return 'EUR';
      case 'BITCOIN':
      case '₿':
        return 'BTC';
      default:
        return normalized;
    }
  }

  formatCurrency(value: number, currency: string): string {
    const normalizedCurrency = this.normalizeCurrency(currency);

    try {
      switch (normalizedCurrency) {
        case 'BTC':
          return `${value.toFixed(8)} ₿`;
        case 'sats':
          return `${Math.round(value).toLocaleString()} sats`;
        case 'USD':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(value);
        case 'BRL':
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(value);
        case 'EUR':
          return new Intl.NumberFormat('en-EU', {
            style: 'currency',
            currency: 'EUR',
          }).format(value);
        default:
          return `${value.toFixed(2)} ${currency}`;
      }
    } catch (error) {
      return `${value.toFixed(2)} ${currency}`;
    }
  }

  getSupportedCurrencies(): string[] {
    return ['BTC', 'USD', 'BRL', 'EUR', 'sats'];
  }

  getCurrencySymbol(currency: string): string {
    const normalized = this.normalizeCurrency(currency);

    switch (normalized) {
      case 'BTC':
        return '₿';
      case 'USD':
        return '$';
      case 'BRL':
        return 'R$';
      case 'EUR':
        return '€';
      case 'sats':
        return 'sats';
      default:
        return currency;
    }
  }

  isCrypto(currency: string): boolean {
    const normalized = this.normalizeCurrency(currency);
    return ['BTC', 'sats'].includes(normalized);
  }

  isFiat(currency: string): boolean {
    const normalized = this.normalizeCurrency(currency);
    return ['USD', 'BRL', 'EUR', 'GBP', 'JPY'].includes(normalized);
  }

  async getHistoricalRates(days: number = 7): Promise<CurrencyRate[]> {
    try {
      // Usar endpoint do backend em vez de CoinGecko diretamente
      const response = await fetch(`/api/market/historical?days=${days}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return result.data.map((item: any) => ({
            from: 'BTC',
            to: 'USD',
            rate: item.price,
            timestamp: item.timestamp,
            source: 'Backend',
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching historical rates:', error);
    }

    return [];
  }

  getLastUpdateTime(): Date {
    return new Date(this.lastUpdate);
  }

  isCacheExpired(): boolean {
    return Date.now() - this.lastUpdate > this.CACHE_DURATION;
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();

// Helper functions for easy use
export const convertCurrency = (value: number, from: string, to: string): ConversionResult => {
  return currencyService.convert(value, from, to);
};

export const formatCurrency = (value: number, currency: string): string => {
  return currencyService.formatCurrency(value, currency);
};

export const getCurrencyRates = (): CurrencyRates => {
  return currencyService.getCurrentRates();
};

export const getSupportedCurrencies = (): string[] => {
  return currencyService.getSupportedCurrencies();
};
