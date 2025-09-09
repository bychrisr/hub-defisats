import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Activity,
  Calendar,
  Eye,
} from 'lucide-react';

const logs = [
  {
    id: 'LOG001',
    timestamp: '2024-01-15 14:30:22.453',
    level: 'success',
    category: 'automation',
    message: 'Margin Guard acionado: Posição BTC/USD reduzida em 50%',
    details: {
      asset: 'BTC/USD',
      action: 'position_reduce',
      oldSize: '$2,500.00',
      newSize: '$1,250.00',
      marginBefore: '92%',
      marginAfter: '76%',
    },
  },
  {
    id: 'LOG002',
    timestamp: '2024-01-15 14:30:21.125',
    level: 'warning',
    category: 'system',
    message: 'Margem crítica detectada: 92% em BTC/USD',
    details: {
      asset: 'BTC/USD',
      currentMargin: '92%',
      threshold: '90%',
      positionSize: '$2,500.00',
    },
  },
  {
    id: 'LOG003',
    timestamp: '2024-01-15 12:15:10.789',
    level: 'success',
    category: 'automation',
    message: 'Take Profit executado: BTC/USD vendido com +8.2% lucro',
    details: {
      asset: 'BTC/USD',
      action: 'take_profit',
      entryPrice: '$42,100.00',
      exitPrice: '$43,200.00',
      profit: '+$67.30',
      profitPercent: '+8.2%',
    },
  },
  {
    id: 'LOG004',
    timestamp: '2024-01-15 09:45:33.234',
    level: 'info',
    category: 'api',
    message: 'Sincronização com LN Markets: Posições atualizadas',
    details: {
      positionsCount: 3,
      totalMargin: '78%',
      lastSync: '2024-01-15 09:45:33',
      status: 'connected',
    },
  },
  {
    id: 'LOG005',
    timestamp: '2024-01-15 08:20:15.567',
    level: 'error',
    category: 'api',
    message: 'Falha na conexão com LN Markets API - Retry em 30s',
    details: {
      errorCode: 'TIMEOUT',
      endpoint: '/v1/user/positions',
      retryCount: 2,
      nextRetry: '2024-01-15 08:20:45',
    },
  },
  {
    id: 'LOG006',
    timestamp: '2024-01-14 22:30:45.123',
    level: 'success',
    category: 'automation',
    message: 'Stop Loss acionado: ETH/USD posição fechada para limitar perdas',
    details: {
      asset: 'ETH/USD',
      action: 'stop_loss',
      entryPrice: '$2,680.00',
      exitPrice: '$2,598.00',
      loss: '-$89.25',
      lossPercent: '-3.1%',
    },
  },
];

export const Logs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesCategory =
      selectedCategory === 'all' || log.category === selectedCategory;

    return matchesSearch && matchesLevel && matchesCategory;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'success':
        return <StatusBadge status="success">Sucesso</StatusBadge>;
      case 'warning':
        return <StatusBadge status="warning">Alerta</StatusBadge>;
      case 'error':
        return <StatusBadge status="error">Erro</StatusBadge>;
      default:
        return <StatusBadge status="active">Info</StatusBadge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Logs do Sistema</h1>
          <p className="text-muted-foreground">
            Rastreabilidade completa de todas as operações e eventos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-success animate-pulse' : 'bg-muted'}`}
            />
            <span className="text-sm text-muted-foreground">
              {autoRefresh ? 'Auto-refresh ativo' : 'Pausado'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`}
            />
            {autoRefresh ? 'Pausar' : 'Ativar'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Filtros de Log</CardTitle>
              <CardDescription>
                Filtre os logs por nível, categoria ou termo de busca
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar logs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                value={selectedLevel}
                onChange={e => setSelectedLevel(e.target.value)}
                className="h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">Todos os níveis</option>
                <option value="success">Sucesso</option>
                <option value="warning">Alerta</option>
                <option value="error">Erro</option>
                <option value="info">Info</option>
              </select>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">Todas as categorias</option>
                <option value="automation">Automação</option>
                <option value="api">API</option>
                <option value="system">Sistema</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex-shrink-0 mt-1">
                  {getLevelIcon(log.level)}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground">
                        {log.id}
                      </span>
                      {getLevelBadge(log.level)}
                      <Badge variant="outline" className="text-xs">
                        {log.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {log.timestamp.split(' ')[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.split(' ')[1]}
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm">{log.message}</p>

                  {log.details && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {Object.entries(log.details)
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <span key={key} className="text-muted-foreground">
                            <strong>{key}:</strong> {String(value)}
                          </span>
                        ))}
                      {Object.keys(log.details).length > 3 && (
                        <span className="text-muted-foreground">
                          +{Object.keys(log.details).length - 3} mais...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum log encontrado
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ||
                  selectedLevel !== 'all' ||
                  selectedCategory !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Nenhuma atividade registrada ainda'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getLevelIcon(selectedLog.level)}
                <div>
                  <CardTitle>Detalhes do Log - {selectedLog.id}</CardTitle>
                  <CardDescription>{selectedLog.timestamp}</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Mensagem</h4>
              <p className="text-sm bg-muted/50 p-3 rounded">
                {selectedLog.message}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Informações</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Nível:</span>
                  <div className="mt-1">{getLevelBadge(selectedLog.level)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Categoria:
                  </span>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedLog.category}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {selectedLog.details && (
              <div>
                <h4 className="font-medium mb-2">Detalhes Técnicos</h4>
                <div className="bg-muted/50 p-3 rounded font-mono text-xs space-y-1">
                  {Object.entries(selectedLog.details).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
