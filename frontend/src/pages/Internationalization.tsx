import React from 'react';
import { InternationalizationDemo } from '@/components/common/InternationalizationDemo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, DollarSign, Zap, TrendingUp } from 'lucide-react';

export const Internationalization = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-primary" />
              <DollarSign className="h-8 w-8 text-green-500" />
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Sistema de Internacionalização
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Demonstração completa do sistema de suporte a múltiplos idiomas e
            conversões inteligentes de moeda em tempo real
          </p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge variant="secondary" className="px-3 py-1">
              <Globe className="h-3 w-3 mr-1" />
              PT-BR & EN-US
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <DollarSign className="h-3 w-3 mr-1" />
              BTC, USD, BRL, EUR
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Tempo Real
            </Badge>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>🌐 Multi-idioma</CardTitle>
              <CardDescription>
                Suporte completo a português brasileiro e inglês americano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• Detecção automática de idioma</li>
                <li>• Interface totalmente traduzida</li>
                <li>• Persistência de preferências</li>
                <li>• Mudança instantânea</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle>💱 Conversão Inteligente</CardTitle>
              <CardDescription>
                Conversões em tempo real entre múltiplas moedas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• APIs externas (CoinGecko)</li>
                <li>• Cache inteligente (5min)</li>
                <li>• Fallback offline</li>
                <li>• Formatação automática</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Zap className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <CardTitle>⚡ Performance</CardTitle>
              <CardDescription>
                Sistema otimizado para máxima performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• Lazy loading de traduções</li>
                <li>• Atualização automática</li>
                <li>• Cache inteligente</li>
                <li>• Interface responsiva</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Demo Component */}
        <InternationalizationDemo />

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Detalhes Técnicos</CardTitle>
            <CardDescription>
              Como foi implementado o sistema de internacionalização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">📚 Bibliotecas Utilizadas:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <code>react-i18next</code> - Framework de i18n</li>
                  <li>• <code>i18next</code> - Engine de tradução</li>
                  <li>• <code>i18next-browser-languagedetector</code> - Detecção automática</li>
                  <li>• <code>axios</code> - Para APIs de câmbio</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">🔗 APIs de Câmbio:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <code>CoinGecko API</code> - Preços de BTC</li>
                  <li>• <code>ExchangeRate-API</code> - Taxas de câmbio</li>
                  <li>• Cache inteligente com fallback</li>
                  <li>• Atualização automática a cada 5min</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">📁 Estrutura de Arquivos:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <code>/i18n/</code> - Configuração e dicionários</li>
                  <li>• <code>/services/currency.service.ts</code> - Conversões</li>
                  <li>• <code>/hooks/useTranslation.ts</code> - Hook personalizado</li>
                  <li>• <code>/hooks/useCurrency.ts</code> - Hook de moedas</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">🎨 Componentes:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <code>LanguageCurrencySelector</code> - Seletor dual</li>
                  <li>• <code>CurrencyConverter</code> - Conversor completo</li>
                  <li>• <code>InternationalizationDemo</code> - Demonstração</li>
                  <li>• Integração no header e configurações</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Exemplos de Uso</CardTitle>
            <CardDescription>
              Como utilizar o sistema nos seus componentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">🌐 Traduções:</h4>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`import { useTranslation } from '@/hooks/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
};`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">💱 Moedas:</h4>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`import { useCurrency } from '@/hooks/useCurrency';

const PriceDisplay = () => {
  const { convert, format } = useCurrency();

  const price = convert(1000, 'BRL', 'USD');

  return (
    <div>
      <span>{price.formatted}</span>
      <small>Taxa: {price.rate.toFixed(4)}</small>
    </div>
  );
};`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
