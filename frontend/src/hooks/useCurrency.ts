import { useState, useEffect, useCallback } from 'react';
import {
  currencyService,
  convertCurrency,
  formatCurrency,
  getCurrencyRates,
  getSupportedCurrencies,
  ConversionResult,
  CurrencyRates
} from '@/services/currency.service';

export interface UseCurrencyOptions {
  autoUpdate?: boolean;
  updateInterval?: number;
}

export const useCurrency = (options: UseCurrencyOptions = {}) => {
  const { autoUpdate = true, updateInterval = 300000 } = options; // 5 minutes default
  const [rates, setRates] = useState<CurrencyRates>(getCurrencyRates());
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const updateRates = useCallback(async () => {
    setLoading(true);
    try {
      await currencyService.updateRates();
      setRates(getCurrencyRates());
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error updating currency rates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial update
    updateRates();

    if (autoUpdate) {
      const interval = setInterval(updateRates, updateInterval);
      return () => clearInterval(interval);
    }
  }, [autoUpdate, updateInterval, updateRates]);

  const convert = useCallback((value: number, from: string, to: string): ConversionResult => {
    return convertCurrency(value, from, to);
  }, []);

  const format = useCallback((value: number, currency: string): string => {
    return formatCurrency(value, currency);
  }, []);

  const isCacheExpired = useCallback(() => {
    return currencyService.isCacheExpired();
  }, []);

  return {
    rates,
    loading,
    lastUpdate,
    convert,
    format,
    updateRates,
    isCacheExpired,
    supportedCurrencies: getSupportedCurrencies(),
    getCurrencySymbol: currencyService.getCurrencySymbol.bind(currencyService),
    isCrypto: currencyService.isCrypto.bind(currencyService),
    isFiat: currencyService.isFiat.bind(currencyService),
  };
};

// Hook específico para conversão rápida
export const useCurrencyConversion = (from: string, to: string) => {
  const { convert, format, rates } = useCurrency();

  const convertValue = useCallback((value: number): ConversionResult => {
    return convert(value, from, to);
  }, [convert, from, to]);

  const getRate = useCallback((): number => {
    if (from === to) return 1;
    const conversion = convert(1, from, to);
    return conversion.rate;
  }, [convert, from, to]);

  return {
    convertValue,
    getRate,
    format,
    rates,
  };
};

// Hook para formatação de moeda inteligente
export const useSmartCurrency = (preferredCurrency: string = 'BRL') => {
  const { format, convert, isCrypto, isFiat } = useCurrency();

  const formatSmart = useCallback((value: number, currency?: string) => {
    const targetCurrency = currency || preferredCurrency;
    return format(value, targetCurrency);
  }, [format, preferredCurrency]);

  const convertAndFormat = useCallback((
    value: number,
    fromCurrency: string,
    toCurrency?: string
  ) => {
    const targetCurrency = toCurrency || preferredCurrency;
    const conversion = convert(value, fromCurrency, targetCurrency);
    return {
      value: conversion.value,
      formatted: conversion.formatted,
      rate: conversion.rate,
    };
  }, [convert, preferredCurrency]);

  return {
    formatSmart,
    convertAndFormat,
    isCrypto,
    isFiat,
  };
};
