import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Calculator,
  Zap
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useTranslation } from '@/hooks/useTranslation';

interface CurrencyConverterProps {
  initialValue?: number;
  initialFrom?: string;
  initialTo?: string;
  showHistory?: boolean;
  compact?: boolean;
  className?: string;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  initialValue = 1,
  initialFrom = 'BTC',
  initialTo = 'BRL',
  showHistory = false,
  compact = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const {
    convert,
    format,
    supportedCurrencies,
    getCurrencySymbol,
    isCrypto,
    isFiat,
    updateRates,
    loading,
    lastUpdate,
    rates,
  } = useCurrency();

  const [fromValue, setFromValue] = useState(initialValue.toString());
  const [fromCurrency, setFromCurrency] = useState(initialFrom);
  const [toCurrency, setToCurrency] = useState(initialTo);
  const [conversion, setConversion] = useState<any>(null);
  const [reverseConversion, setReverseConversion] = useState<any>(null);

  // Calculate conversion whenever inputs change
  useEffect(() => {
    const value = parseFloat(fromValue) || 0;

    if (value > 0) {
      const result = convert(value, fromCurrency, toCurrency);
      setConversion(result);

      // Calculate reverse conversion (1 unit of target currency to source)
      const reverse = convert(1, toCurrency, fromCurrency);
      setReverseConversion(reverse);
    } else {
      setConversion(null);
      setReverseConversion(null);
    }
  }, [fromValue, fromCurrency, toCurrency, convert]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleQuickAmount = (amount: number) => {
    setFromValue(amount.toString());
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 8 });
  };

  if (compact) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                placeholder="0.00"
                className="text-right"
              />
            </div>

            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ArrowRight className="h-4 w-4 text-muted-foreground" />

            <div className="flex-1">
              <Input
                type="text"
                value={conversion?.formatted || '0.00'}
                readOnly
                className="text-right bg-muted"
              />
            </div>

            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {conversion && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              1 {fromCurrency} = {formatNumber(conversion.rate)} {toCurrency}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('currency.convert_to')}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={updateRates}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('currency.manual_update')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Conversion */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* From */}
          <div className="md:col-span-2 space-y-2">
            <Label>{t('common.from')}</Label>
            <Input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              placeholder="0.00"
              className="text-right text-lg"
            />
          </div>

          <div className="flex justify-center">
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{getCurrencySymbol(currency)}</span>
                      <span>{currency}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwapCurrencies}
              className="rounded-full"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* To */}
          <div className="md:col-span-2 space-y-2">
            <Label>{t('common.to')}</Label>
            <div className="relative">
              <Input
                type="text"
                value={conversion?.formatted || '0.00'}
                readOnly
                className="text-right text-lg bg-muted"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {getCurrencySymbol(toCurrency)}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{getCurrencySymbol(currency)}</span>
                      <span>{currency}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2">{t('common.quick')}:</span>
          {[0.1, 1, 10, 100, 1000].map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(amount)}
            >
              {formatNumber(amount)} {fromCurrency}
            </Button>
          ))}
        </div>

        {/* Conversion Details */}
        {conversion && (
          <div className="space-y-4">
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Exchange Rate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  {t('currency.exchange_rate')}
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm">
                    1 {fromCurrency} = {formatNumber(conversion.rate)} {toCurrency}
                  </div>
                  {reverseConversion && (
                    <div className="text-sm text-muted-foreground mt-1">
                      1 {toCurrency} = {formatNumber(reverseConversion.rate)} {fromCurrency}
                    </div>
                  )}
                </div>
              </div>

              {/* Market Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  {t('market.price')}
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm">
                    BTC: {format(rates.BTC, 'USD')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('currency.last_updated')}: {lastUpdate.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                {isCrypto(fromCurrency) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Crypto
                  </Badge>
                )}
                {isFiat(fromCurrency) && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Fiat
                  </Badge>
                )}
                <span>→</span>
                {isCrypto(toCurrency) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Crypto
                  </Badge>
                )}
                {isFiat(toCurrency) && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Fiat
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Current Rates Table */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">{t('currency.current_rate')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {supportedCurrencies.slice(0, 4).map((currency) => (
              <div key={currency} className="bg-muted p-2 rounded text-xs">
                <div className="font-medium">{currency}</div>
                <div className="text-muted-foreground">
                  {currency === 'BTC' ? format(rates.BTC, 'USD') :
                   currency === 'USD' ? '$1.00' :
                   currency === 'BRL' ? format(1 / rates.BRL, 'USD') :
                   currency === 'EUR' ? format(1 / rates.EUR, 'USD') :
                   format(rates.sats, 'USD')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
