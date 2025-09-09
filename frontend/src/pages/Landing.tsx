import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Shield,
  TrendingUp,
  Zap,
  BarChart3,
  Clock,
  CheckCircle,
  ArrowRight,
  Bitcoin,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LN</span>
            </div>
            <span className="font-bold text-xl">Margin Guard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button className="btn-hero">Começar Gratuitamente</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            🚀 Proteja seus trades automaticamente
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Nunca mais perca tudo por não fechar uma posição
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Automatize sua proteção contra liquidação na LN Markets. Margin
            Guard monitora suas posições 24/7 e age quando você não pode.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup">
              <Button size="lg" className="btn-hero text-lg px-8 py-4">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              Ver Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Sem taxas ocultas</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <span>Seguro e confiável</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-success" />
              <span>Proteção 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problems/Solutions */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Por que você precisa do Margin Guard?
            </h2>
            <p className="text-xl text-muted-foreground">
              Os problemas que todo trader enfrenta
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-danger">
              <CardHeader>
                <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                <CardTitle className="text-destructive">
                  Liquidação Inesperada
                </CardTitle>
                <CardDescription>
                  Você não consegue monitorar suas posições 24/7. Uma
                  volatilidade inesperada pode liquidar tudo enquanto você
                  dorme.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-danger">
              <CardHeader>
                <DollarSign className="h-8 w-8 text-destructive mb-2" />
                <CardTitle className="text-destructive">
                  Perda de Capital
                </CardTitle>
                <CardDescription>
                  Sem stops automáticos, uma única posição mal gerenciada pode
                  acabar com meses de lucros.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-danger">
              <CardHeader>
                <Clock className="h-8 w-8 text-destructive mb-2" />
                <CardTitle className="text-destructive">
                  Falta de Tempo
                </CardTitle>
                <CardDescription>
                  Você tem vida além do trading. Não pode ficar colado na tela
                  24 horas por dia.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold mb-8">Nossa Solução</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="card-success">
                <CardHeader>
                  <Shield className="h-8 w-8 text-success mb-2" />
                  <CardTitle className="text-success">
                    Proteção Automática
                  </CardTitle>
                  <CardDescription>
                    Monitora sua margem em tempo real e fecha posições
                    automaticamente antes da liquidação.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-success">
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-success mb-2" />
                  <CardTitle className="text-success">
                    Preserva Capital
                  </CardTitle>
                  <CardDescription>
                    Stop loss inteligente que se adapta às condições de mercado
                    para maximizar proteção.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-success">
                <CardHeader>
                  <Zap className="h-8 w-8 text-success mb-2" />
                  <CardTitle className="text-success">
                    Execução Rápida
                  </CardTitle>
                  <CardDescription>
                    Reação em milissegundos. Mais rápido que qualquer trader
                    manual conseguiria.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Recursos Principais</h2>
            <p className="text-xl text-muted-foreground">
              Tudo que você precisa para proteger seus trades
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Margin Guard</CardTitle>
                <CardDescription>
                  Proteção automática contra liquidação com limites
                  personalizáveis
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Take Profit / Stop Loss</CardTitle>
                <CardDescription>
                  Automatize suas saídas com TP/SL inteligentes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Relatórios Detalhados</CardTitle>
                <CardDescription>
                  Análise completa de performance e histórico de trades
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Bitcoin className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Integração LN Markets</CardTitle>
                <CardDescription>
                  Conexão direta e segura com sua conta LN Markets
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Proteja seus trades hoje mesmo
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a centenas de traders que já protegem seus capitais com
            Margin Guard
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Input
              placeholder="Seu melhor email"
              className="bg-white text-foreground"
            />
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 whitespace-nowrap"
            >
              Começar Agora
            </Button>
          </div>

          <p className="text-sm mt-4 opacity-75">
            Gratuito para começar. Sem compromisso.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">LN</span>
              </div>
              <span className="font-bold">Margin Guard</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">
                Termos de Uso
              </a>
              <a href="#" className="hover:text-foreground">
                Política de Privacidade
              </a>
              <a href="#" className="hover:text-foreground">
                Suporte
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 Margin Guard. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};
