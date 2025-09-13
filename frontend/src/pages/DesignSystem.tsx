import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTheme, useThemeClasses, useThemeColors } from '@/contexts/ThemeContext';
import CoinGeckoCard from '@/components/CoinGeckoCard';
import PriceChange from '@/components/PriceChange';
import { 
  Palette, 
  Type, 
  Layout, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  Settings,
  User,
  Bell,
  Star
} from 'lucide-react';

const ColorSwatch = ({ name, color, description, className = '' }: {
  name: string;
  color: string;
  description: string;
  className?: string;
}) => (
  <div className={`p-4 rounded-lg border ${className}`}>
    <div 
      className="w-full h-16 rounded-md mb-3 border"
      style={{ backgroundColor: color }}
    />
    <h4 className="font-semibold text-sm mb-1">{name}</h4>
    <p className="text-xs text-muted-foreground mb-2">{color}</p>
    <p className="text-xs text-text-secondary">{description}</p>
  </div>
);

const TypographyExample = ({ variant, text, className = '' }: {
  variant: string;
  text: string;
  className?: string;
}) => (
  <div className="space-y-2">
    <Label className="text-xs text-muted-foreground">{variant}</Label>
    <div className={className}>{text}</div>
  </div>
);

export default function DesignSystem() {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const themeColors = useThemeColors();

  const sampleData = [
    { name: 'Bitcoin', symbol: 'BTC', price: 43250.50, change: 2.34, volume: '2.1B' },
    { name: 'Ethereum', symbol: 'ETH', price: 2650.75, change: -1.25, volume: '1.8B' },
    { name: 'Cardano', symbol: 'ADA', price: 0.485, change: 5.67, volume: '450M' },
    { name: 'Solana', symbol: 'SOL', price: 98.20, change: -0.89, volume: '320M' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Palette className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-text-primary">Design System</h1>
        </div>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Identidade visual inspirada no CoinGecko - Paleta de cores, tipografia e componentes
        </p>
        <Badge variant="outline" className="text-primary border-primary">
          Tema Atual: {theme === 'light' ? 'Claro' : 'Escuro'}
        </Badge>
      </div>

      {/* Cores Principais */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Palette className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">Cores Principais</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ColorSwatch
            name="Primária"
            color="#3773f5"
            description="Botões primários, links, CTAs"
            className="bg-card"
          />
          <ColorSwatch
            name="Secundária"
            color="#f5ac37"
            description="Badges, alertas, destaques"
            className="bg-card"
          />
          <ColorSwatch
            name="Sucesso"
            color="#0ecb81"
            description="Valores positivos, confirmações"
            className="bg-card"
          />
          <ColorSwatch
            name="Destrutiva"
            color="#f6465d"
            description="Valores negativos, erros"
            className="bg-card"
          />
        </div>
      </section>

      {/* Cores do Tema Atual */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Layout className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">
            Cores do Tema {theme === 'light' ? 'Claro' : 'Escuro'}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ColorSwatch
            name="Fundo Principal"
            color={themeColors.background}
            description="Background da aplicação"
            className="bg-card"
          />
          <ColorSwatch
            name="Texto Principal"
            color={themeColors.textPrimary}
            description="Títulos, textos importantes"
            className="bg-card"
          />
          <ColorSwatch
            name="Texto Secundário"
            color={themeColors.textSecondary}
            description="Textos auxiliares"
            className="bg-card"
          />
          <ColorSwatch
            name="Bordas"
            color={themeColors.border}
            description="Divisores, bordas"
            className="bg-card"
          />
          <ColorSwatch
            name="Cards"
            color={themeColors.card}
            description="Fundo de cards"
            className="bg-card"
          />
          <ColorSwatch
            name="Header"
            color={themeColors.header}
            description="Cabeçalhos de tabela"
            className="bg-card"
          />
        </div>
      </section>

      {/* Tipografia */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Type className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">Tipografia</h2>
        </div>
        
        <CoinGeckoCard>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <TypographyExample
                variant="Heading 1"
                text="Heading 1 - Inter Bold"
                className="text-4xl font-bold text-text-primary"
              />
              <TypographyExample
                variant="Heading 2"
                text="Heading 2 - Inter Semibold"
                className="text-3xl font-semibold text-text-primary"
              />
              <TypographyExample
                variant="Heading 3"
                text="Heading 3 - Inter Medium"
                className="text-2xl font-medium text-text-primary"
              />
              <TypographyExample
                variant="Body Large"
                text="Body Large - Inter Regular"
                className="text-lg text-text-primary"
              />
              <TypographyExample
                variant="Body Regular"
                text="Body Regular - Inter Regular"
                className="text-base text-text-primary"
              />
              <TypographyExample
                variant="Body Small"
                text="Body Small - Inter Regular"
                className="text-sm text-text-secondary"
              />
              <TypographyExample
                variant="Caption"
                text="Caption - Inter Regular"
                className="text-xs text-text-secondary"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-semibold text-text-primary">Fonte Monospace (JetBrains Mono)</h4>
              <div className="bg-muted p-4 rounded-md">
                <code className="text-sm font-mono text-text-primary">
                  const price = 43250.50;<br />
                  const change = +2.34;<br />
                  console.log(`BTC: $${price} (${change}%)`);
                </code>
              </div>
            </div>
          </CardContent>
        </CoinGeckoCard>
      </section>

      {/* Componentes */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">Componentes</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Botões */}
          <CoinGeckoCard>
            <CardHeader>
              <CardTitle>Botões</CardTitle>
              <CardDescription>Diferentes estilos e tamanhos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button className="coingecko-btn-primary">Primário</Button>
                <Button variant="secondary" className="coingecko-btn-secondary">Secundário</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="sm">Pequeno</Button>
                <Button size="default">Padrão</Button>
                <Button size="lg">Grande</Button>
              </div>
            </CardContent>
          </CoinGeckoCard>

          {/* Badges */}
          <CoinGeckoCard>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Indicadores de status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-primary text-primary-foreground">Primário</Badge>
                <Badge className="bg-secondary text-secondary-foreground">Secundário</Badge>
                <Badge className="bg-success text-success-foreground">Sucesso</Badge>
                <Badge className="bg-destructive text-destructive-foreground">Erro</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </CoinGeckoCard>

          {/* Inputs */}
          <CoinGeckoCard>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>Campos de formulário</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" className="coingecko-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" className="coingecko-input" />
              </div>
            </CardContent>
          </CoinGeckoCard>

          {/* Valores de Preço */}
          <CoinGeckoCard>
            <CardHeader>
              <CardTitle>Valores de Preço</CardTitle>
              <CardDescription>Componente PriceChange</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Positivo:</span>
                  <PriceChange value={3.24} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Negativo:</span>
                  <PriceChange value={-1.85} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Zero:</span>
                  <PriceChange value={0} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Sem ícone:</span>
                  <PriceChange value={2.15} showIcon={false} />
                </div>
              </div>
            </CardContent>
          </CoinGeckoCard>
        </div>
      </section>

      {/* Tabela de Exemplo */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">Tabela de Exemplo</h2>
        </div>
        
        <CoinGeckoCard>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="coingecko-table w-full">
                <thead>
                  <tr>
                    <th>Moeda</th>
                    <th>Preço</th>
                    <th>Mudança 24h</th>
                    <th>Volume</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((coin, index) => (
                    <tr key={index}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {coin.symbol.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{coin.name}</div>
                            <div className="text-sm text-text-secondary">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-mono text-text-primary">
                          ${coin.price.toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <PriceChange value={coin.change} />
                      </td>
                      <td>
                        <div className="text-text-secondary">{coin.volume}</div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </CoinGeckoCard>
      </section>

      {/* Cards de Exemplo */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Layout className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">Cards de Exemplo</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CoinGeckoCard>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                <CardTitle>Portfolio</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-text-primary">$12,450.30</div>
                <div className="flex items-center gap-2">
                  <PriceChange value={2.34} />
                  <span className="text-sm text-text-secondary">24h</span>
                </div>
              </div>
            </CardContent>
          </CoinGeckoCard>

          <CoinGeckoCard variant="gradient">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-secondary" />
                <CardTitle>Favoritos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-lg font-semibold text-text-primary">5 Moedas</div>
                <div className="text-sm text-text-secondary">Seguindo ativamente</div>
              </div>
            </CardContent>
          </CoinGeckoCard>

          <CoinGeckoCard>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notificações</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-lg font-semibold text-text-primary">3 Novas</div>
                <div className="text-sm text-text-secondary">Alertas ativos</div>
              </div>
            </CardContent>
          </CoinGeckoCard>
        </div>
      </section>

      {/* Transições */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">Transições</h2>
        </div>
        
        <CoinGeckoCard>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary rounded-lg mx-auto transition-all duration-200 hover:scale-110 hover:bg-primary/80"></div>
                <p className="text-sm text-text-secondary">Rápida (200ms)</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-secondary rounded-lg mx-auto transition-all duration-300 hover:scale-110 hover:bg-secondary/80"></div>
                <p className="text-sm text-text-secondary">Suave (300ms)</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-success rounded-lg mx-auto transition-all duration-500 hover:scale-110 hover:bg-success/80"></div>
                <p className="text-sm text-text-secondary">Lenta (500ms)</p>
              </div>
            </div>
          </CardContent>
        </CoinGeckoCard>
      </section>

      {/* Footer */}
      <div className="text-center py-8 border-t border-border">
        <p className="text-text-secondary">
          Design System inspirado no CoinGecko • Mantendo a tipografia Inter
        </p>
      </div>
    </div>
  );
}
