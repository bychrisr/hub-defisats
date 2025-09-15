import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Globe,
  DollarSign,
  Coins,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useSmartFormat } from '@/hooks/useSmartFormat';

export const InternationalizationDemo: React.FC = () => {
  const { t, changeLanguage, getCurrentLanguage, isPortuguese, isEnglish } = useTranslation();
  const { convert, format, supportedCurrencies, updateRates, loading, lastUpdate } = useCurrency();
  const {
    formatValue,
    formatPercentage,
    formatDate,
    formatNumber,
    formatSats,
    formatPnL,
    formatStatus,
    formatDuration
  } = useSmartFormat();

  const [demoValue, setDemoValue] = useState(1000);

  const demoData = {
    balance: 150000,
    pnl: 25000,
    pnlPercentage: 16.7,
    trades: 45,
    winRate: 68.5,
    volume: 2500000,
    sats: 5000000,
    timestamp: new Date(),
    duration: 3725, // seconds
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Demonstração: Internacionalização + Moedas
          </CardTitle>
          <CardDescription>
            Sistema completo de suporte a múltiplos idiomas e conversões de moeda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Idioma:</span>
            <div className="flex gap-2">
              <Button
                variant={isPortuguese() ? "default" : "outline"}
                size="sm"
                onClick={() => changeLanguage('pt-BR')}
              >
                🇧🇷 Português
              </Button>
              <Button
                variant={isEnglish() ? "default" : "outline"}
                size="sm"
                onClick={() => changeLanguage('en-US')}
              >
                🇺🇸 English
              </Button>
            </div>
            <Badge variant="secondary">
              Atual: {isPortuguese() ? 'Português (BR)' : 'English (US)'}
            </Badge>
          </div>

          {/* Currency Update */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Cotações:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={updateRates}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
            <span className="text-xs text-muted-foreground">
              Última: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Translation Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Exemplos de Tradução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Interface:</div>
              <div className="space-y-1 text-sm">
                <div><strong>{t('common.loading')}:</strong> {t('common.loading')}</div>
                <div><strong>{t('common.success')}:</strong> {t('common.success')}</div>
                <div><strong>{t('common.error')}:</strong> {t('common.error')}</div>
                <div><strong>{t('navigation.dashboard')}:</strong> {t('navigation.dashboard')}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Status:</div>
              <div className="space-y-1 text-sm">
                <div><strong>Ativo:</strong> {formatStatus('active')}</div>
                <div><strong>Pendente:</strong> {formatStatus('pending')}</div>
                <div><strong>Concluído:</strong> {formatStatus('completed')}</div>
                <div><strong>Erro:</strong> {formatStatus('error')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Exemplos de Formatação de Moeda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded">
                <div className="text-xs text-muted-foreground mb-1">BRL</div>
                <div className="font-medium">{format(demoValue, 'BRL')}</div>
              </div>
              <div className="text-center p-3 bg-muted rounded">
                <div className="text-xs text-muted-foreground mb-1">USD</div>
                <div className="font-medium">{format(demoValue, 'USD')}</div>
              </div>
              <div className="text-center p-3 bg-muted rounded">
                <div className="text-xs text-muted-foreground mb-1">BTC</div>
                <div className="font-medium">{format(demoValue, 'BTC')}</div>
              </div>
              <div className="text-center p-3 bg-muted rounded">
                <div className="text-xs text-muted-foreground mb-1">Sats</div>
                <div className="font-medium">{format(demoValue, 'sats')}</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Conversões:</div>
                <div className="space-y-1 text-sm">
                  <div>1000 BRL → USD: {convert(1000, 'BRL', 'USD').formatted}</div>
                  <div>1 BTC → BRL: {convert(1, 'BTC', 'BRL').formatted}</div>
                  <div>1000000 sats → USD: {convert(1000000, 'sats', 'USD').formatted}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Smart Format:</div>
                <div className="space-y-1 text-sm">
                  <div>Valor grande: {formatValue(1500000)}</div>
                  <div>Percentual: {formatPercentage(25.5)}</div>
                  <div>Satoshis: {formatSats(5000000)}</div>
                  <div>P&L: {formatPnL(15000)}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Data Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Dados de Trading (Formatados)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded">
              <div className="text-sm text-muted-foreground mb-1">Saldo</div>
              <div className="text-lg font-bold text-green-600">
                {formatValue(demoData.balance, 'BRL')}
              </div>
            </div>

            <div className="text-center p-4 border rounded">
              <div className="text-sm text-muted-foreground mb-1">P&L</div>
              <div className="text-lg font-bold text-green-600">
                {formatPnL(demoData.pnl, 'BRL', true)}
              </div>
            </div>

            <div className="text-center p-4 border rounded">
              <div className="text-sm text-muted-foreground mb-1">Trades</div>
              <div className="text-lg font-bold">
                {formatNumber(demoData.trades)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatPercentage(demoData.winRate)} win rate
              </div>
            </div>

            <div className="text-center p-4 border rounded">
              <div className="text-sm text-muted-foreground mb-1">Volume</div>
              <div className="text-lg font-bold">
                {formatValue(demoData.volume, 'BRL')}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span>{formatSats(demoData.sats)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(demoData.timestamp)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(demoData.duration)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recursos Implementados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">🌐 Internacionalização:</div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Suporte a PT-BR e EN-US</li>
                <li>• Detecção automática de idioma</li>
                <li>• Persistência de preferência</li>
                <li>• Dicionários completos</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">💱 Sistema de Moedas:</div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Conversão em tempo real</li>
                <li>• APIs externas (CoinGecko, ExchangeRate)</li>
                <li>• Suporte a BTC, USD, BRL, EUR</li>
                <li>• Formatação inteligente</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">🎨 Interface:</div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Seletor no header</li>
                <li>• Página de configurações</li>
                <li>• Conversor integrado</li>
                <li>• Feedback visual</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">⚡ Performance:</div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Cache inteligente</li>
                <li>• Atualização automática</li>
                <li>• Fallback para offline</li>
                <li>• Lazy loading</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
