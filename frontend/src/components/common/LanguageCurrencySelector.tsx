import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Languages,
  DollarSign,
  Coins,
  Globe,
  Check,
  RefreshCw,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/contexts/ThemeContext';

interface LanguageCurrencySelectorProps {
  variant?: 'header' | 'settings';
  showLabels?: boolean;
  compact?: boolean;
}

export const LanguageCurrencySelector: React.FC<LanguageCurrencySelectorProps> = ({
  variant = 'header',
  showLabels = true,
  compact = false,
}) => {
  const { t, changeLanguage, getCurrentLanguage, isPortuguese, isEnglish } = useTranslation();
  const {
    format,
    updateRates,
    loading,
    lastUpdate,
    supportedCurrencies,
    getCurrencySymbol,
    isCrypto,
    isFiat,
    rates
  } = useCurrency();
  const { theme } = useTheme();

  const [selectedCurrency, setSelectedCurrency] = useState('BRL');

  const languages = [
    { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  ];

  const handleLanguageChange = (languageCode: 'pt-BR' | 'en-US') => {
    changeLanguage(languageCode);
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    // Here you could save the preference to user settings
    localStorage.setItem('preferred-currency', currency);
  };

  // Load preferred currency from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('preferred-currency');
    if (saved) {
      setSelectedCurrency(saved);
    }
  }, []);

  const currentLanguage = languages.find(lang => lang.code === getCurrentLanguage());

  if (variant === 'header') {
    if (compact) {
      return (
        <div className="flex items-center gap-1">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>{t('settings.language')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code as any)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span>{language.flag}</span>
                    <span className="text-sm">{language.name}</span>
                  </span>
                  {getCurrentLanguage() === language.code && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isCrypto(selectedCurrency) ? (
                  <Coins className="h-4 w-4" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>{t('settings.currency')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={updateRates}
                  disabled={loading}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {supportedCurrencies.map((currency) => (
                <DropdownMenuItem
                  key={currency}
                  onClick={() => handleCurrencyChange(currency)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {getCurrencySymbol(currency)}
                    </span>
                    <span className="text-sm">{currency}</span>
                    {isCrypto(currency) && <Badge variant="secondary" className="text-xs">Crypto</Badge>}
                    {isFiat(currency) && <Badge variant="outline" className="text-xs">Fiat</Badge>}
                  </span>
                  {selectedCurrency === currency && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <span className="text-lg">{currentLanguage?.flag}</span>
              {showLabels && <span className="hidden sm:inline">{currentLanguage?.name}</span>}
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t('settings.language')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => handleLanguageChange(language.code as any)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.name}</span>
                </span>
                {getCurrentLanguage() === language.code && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Currency Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <span className="font-mono">{getCurrencySymbol(selectedCurrency)}</span>
              {showLabels && <span className="hidden sm:inline">{selectedCurrency}</span>}
              {isCrypto(selectedCurrency) ? (
                <Coins className="h-4 w-4" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>{t('settings.currency')}</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {supportedCurrencies.map((currency) => (
              <DropdownMenuItem
                key={currency}
                onClick={() => handleCurrencyChange(currency)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">
                    {getCurrencySymbol(currency)}
                  </span>
                  <span className="text-sm">{currency}</span>
                  {isCrypto(currency) && <Badge variant="secondary" className="text-xs">Crypto</Badge>}
                  {isFiat(currency) && <Badge variant="outline" className="text-xs">Fiat</Badge>}
                </div>
                {selectedCurrency === currency && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={updateRates} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('currency.manual_update')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Settings variant - more detailed
  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <h3 className="text-lg font-medium">{t('settings.language')}</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {languages.map((language) => (
            <Button
              key={language.code}
              variant={getCurrentLanguage() === language.code ? "default" : "outline"}
              onClick={() => handleLanguageChange(language.code as any)}
              className="justify-start"
            >
              <span className="text-lg mr-2">{language.flag}</span>
              <span className="flex-1 text-left">{language.name}</span>
              {getCurrentLanguage() === language.code && (
                <Check className="h-4 w-4" />
              )}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Currency Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h3 className="text-lg font-medium">{t('settings.currency')}</h3>
          </div>
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

        <div className="text-sm text-muted-foreground">
          {t('currency.last_updated')}: {lastUpdate.toLocaleString()}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {supportedCurrencies.map((currency) => (
            <Button
              key={currency}
              variant={selectedCurrency === currency ? "default" : "outline"}
              onClick={() => handleCurrencyChange(currency)}
              className="justify-start h-auto p-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg">
                    {getCurrencySymbol(currency)}
                  </span>
                  <div className="text-left">
                    <div className="font-medium">{currency}</div>
                    {isCrypto(currency) && (
                      <div className="text-xs opacity-70">Cryptocurrency</div>
                    )}
                    {isFiat(currency) && (
                      <div className="text-xs opacity-70">Fiat Currency</div>
                    )}
                  </div>
                </div>
                {selectedCurrency === currency && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Current Rates Display */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">{t('currency.current_rate')}</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>1 BTC = {format(rates.BTC, 'USD')}</div>
            <div>1 USD = {format(1 / rates.BRL, 'BRL')}</div>
            <div>1 sats = {format(rates.sats, 'USD')}</div>
            <div>1 EUR = {format(1 / rates.EUR, 'USD')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
