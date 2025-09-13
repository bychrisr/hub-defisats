import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, BarChart3 } from 'lucide-react';

export const Backtests = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Backtests</h1>
          <p className="text-muted-foreground">
            Análise de performance de estratégias de trading
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Backtests</CardTitle>
              <CardDescription>
                Em breve - Análise de performance de estratégias
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade estará disponível em uma próxima atualização.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
              <p>• Análise de performance histórica</p>
              <p>• Simulação de estratégias</p>
              <p>• Relatórios detalhados</p>
              <p>• Comparação de estratégias</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Backtests;
