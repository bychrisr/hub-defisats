import { useTranslation } from './useTranslation';
import { useSmartCurrency } from './useCurrency';

export interface SmartFormatOptions {
  currency?: string;
  showSymbol?: boolean;
  compact?: boolean;
  locale?: string;
}

export const useSmartFormat = () => {
  const { t } = useTranslation();
  const { formatSmart, convertAndFormat } = useSmartCurrency();

  /**
   * Formatação inteligente de valores monetários
   * Suporta conversão automática baseada na moeda preferida do usuário
   */
  const formatValue = (
    value: number,
    currency?: string,
    options: SmartFormatOptions = {}
  ): string => {
    const {
      showSymbol = true,
      compact = false,
      locale
    } = options;

    if (compact && value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }

    if (compact && value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }

    return formatSmart(value, currency);
  };

  /**
   * Formatação inteligente de percentuais
   */
  const formatPercentage = (
    value: number,
    decimals: number = 1,
    showSign: boolean = true
  ): string => {
    const formatted = `${value >= 0 && showSign ? '+' : ''}${value.toFixed(decimals)}%`;
    return formatted;
  };

  /**
   * Formatação inteligente de datas
   */
  const formatDate = (
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {}
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...options,
    });
  };

  /**
   * Formatação inteligente de números grandes
   */
  const formatNumber = (
    value: number,
    options: Intl.NumberFormatOptions = {}
  ): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }

    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(value);
  };

  /**
   * Formatação inteligente de satoshis
   */
  const formatSats = (value: number): string => {
    if (value >= 100000000) { // 1 BTC
      return `${(value / 100000000).toFixed(8)} ₿`;
    }
    if (value >= 1000000) { // 0.01 BTC
      return `${(value / 1000000).toFixed(2)}M sats`;
    }
    if (value >= 1000) { // 0.00001 BTC
      return `${(value / 1000).toFixed(1)}K sats`;
    }
    return `${Math.round(value).toLocaleString()} sats`;
  };

  /**
   * Conversão inteligente com formatação
   */
  const convertValue = (
    value: number,
    fromCurrency: string,
    toCurrency?: string
  ) => {
    return convertAndFormat(value, fromCurrency, toCurrency);
  };

  /**
   * Formatação de mensagens de status
   */
  const formatStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'active': t('common.active') || 'Ativo',
      'inactive': t('common.inactive') || 'Inativo',
      'pending': t('common.pending') || 'Pendente',
      'completed': t('common.completed') || 'Concluído',
      'failed': t('common.failed') || 'Falhou',
      'success': t('common.success') || 'Sucesso',
      'error': t('common.error') || 'Erro',
      'loading': t('common.loading') || 'Carregando',
    };

    return statusMap[status.toLowerCase()] || status;
  };

  /**
   * Formatação de durações de tempo
   */
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  /**
   * Formatação de valores de P&L (Profit & Loss)
   */
  const formatPnL = (
    value: number,
    currency: string = 'BRL',
    showPercentage: boolean = false
  ): string => {
    const formatted = formatValue(Math.abs(value), currency);
    const sign = value >= 0 ? '+' : '-';
    const percentage = showPercentage ? ` (${formatPercentage(value)})` : '';

    return `${sign}${formatted}${percentage}`;
  };

  return {
    formatValue,
    formatPercentage,
    formatDate,
    formatNumber,
    formatSats,
    convertValue,
    formatStatus,
    formatDuration,
    formatPnL,
  };
};
