// src/pages/IndicatorTestPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LightweightLiquidationChartWithIndicators from '@/components/charts/LightweightLiquidationChartWithIndicators';
import { Activity, BarChart3, TrendingUp, Settings, RefreshCw } from 'lucide-react';

// Dados de teste simulados
const generateTestData = (count: number = 100) => {
  const data = [];
  let price = 50000;
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const time = (now - (count - i) * 3600000) / 1000; // 1 hora atrás por ponto
    const change = (Math.random() - 0.5) * 0.02; // ±1% de mudança
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.random() * 1000000;
    
    data.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
  }
  
  return data;
};

const IndicatorTestPage: React.FC = () => {
  const [testData, setTestData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useApiData, setUseApiData] = useState(false);
  const [testResults, setTestResults] = useState<{
    rsiCalculated: boolean;
    rsiDataPoints: number;
    cacheHits: number;
    lastUpdate: number;
  }>({
    rsiCalculated: false,
    rsiDataPoints: 0,
    cacheHits: 0,
    lastUpdate: 0
  });

  const [persistenceInfo, setPersistenceInfo] = useState<{
    available: boolean;
    used: number;
    total: number;
    percentage: number;
  }>({
    available: false,
    used: 0,
    total: 0,
    percentage: 0
  });

  const [backendInfo, setBackendInfo] = useState<{
    connected: boolean;
    lastSync: Date | null;
    totalConfigs: number;
    version: string | null;
  }>({
    connected: false,
    lastSync: null,
    totalConfigs: 0,
    version: null
  });

  // Gerar dados de teste
  const generateData = async () => {
    setIsGenerating(true);
    
    // Simular delay de geração
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const data = generateTestData(168); // 7 dias de dados
    setTestData(data);
    
    console.log('📊 TEST DATA - Dados de teste gerados:', {
      count: data.length,
      firstTime: new Date(data[0].time * 1000).toISOString(),
      lastTime: new Date(data[data.length - 1].time * 1000).toISOString(),
      priceRange: {
        min: Math.min(...data.map(d => d.low)),
        max: Math.max(...data.map(d => d.high))
      }
    });
    
    setIsGenerating(false);
  };

  // Gerar dados iniciais
  useEffect(() => {
    generateData();
  }, []);

  // Simular atualizações de teste
  const runTest = async () => {
    console.log('🧪 INDICATOR TEST - Iniciando teste de indicadores...');
    
    // Simular múltiplas atualizações
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`🧪 INDICATOR TEST - Iteração ${i + 1}/5`);
    }
    
    setTestResults(prev => ({
      ...prev,
      rsiCalculated: true,
      rsiDataPoints: 150,
      cacheHits: 3,
      lastUpdate: Date.now()
    }));
    
    console.log('✅ INDICATOR TEST - Teste concluído');
  };

  // Testar persistência
  const testPersistence = () => {
    console.log('🧪 PERSISTENCE - Testando persistência...');
    setPersistenceInfo(prev => ({
      ...prev,
      available: true,
      used: 1024,
      total: 5120,
      percentage: 20
    }));
  };

  // Exportar configurações
  const exportConfigs = () => {
    console.log('📤 PERSISTENCE - Exportando configurações...');
  };

  // Importar configurações
  const importConfigs = () => {
    console.log('📥 PERSISTENCE - Importando configurações...');
  };

  // Limpar configurações
  const clearConfigs = () => {
    console.log('🧹 PERSISTENCE - Limpando configurações...');
  };

  // Testar backend
  const testBackendConnection = async () => {
    try {
      console.log('🔄 BACKEND TEST - Testing backend connection');
      const success = await syncWithBackend();
      setBackendInfo(prev => ({ ...prev, connected: success }));
      console.log('✅ BACKEND TEST - Backend connection test completed:', success);
    } catch (error) {
      console.error('❌ BACKEND TEST - Backend connection test failed:', error);
      setBackendInfo(prev => ({ ...prev, connected: false }));
    }
  };

  const saveToBackend = async () => {
    try {
      console.log('💾 BACKEND TEST - Saving to backend');
      const success = await saveToBackend();
      if (success) {
        setBackendInfo(prev => ({ ...prev, lastSync: new Date() }));
        console.log('✅ BACKEND TEST - Successfully saved to backend');
      }
    } catch (error) {
      console.error('❌ BACKEND TEST - Failed to save to backend:', error);
    }
  };

  const loadFromBackend = async () => {
    try {
      console.log('📦 BACKEND TEST - Loading from backend');
      const success = await loadFromBackend();
      if (success) {
        setBackendInfo(prev => ({ ...prev, lastSync: new Date() }));
        console.log('✅ BACKEND TEST - Successfully loaded from backend');
        // Recarregar página para aplicar configurações
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ BACKEND TEST - Failed to load from backend:', error);
    }
  };

  const clearFromBackend = async () => {
    try {
      console.log('🗑️ BACKEND TEST - Clearing from backend');
      const success = await clearFromBackend();
      if (success) {
        setBackendInfo(prev => ({ ...prev, lastSync: new Date(), totalConfigs: 0 }));
        console.log('✅ BACKEND TEST - Successfully cleared from backend');
        // Recarregar página
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ BACKEND TEST - Failed to clear from backend:', error);
    }
  };

  const exportFromBackend = async () => {
    try {
      console.log('📤 BACKEND TEST - Exporting from backend');
      const jsonData = await exportFromBackend();
      if (jsonData) {
        navigator.clipboard.writeText(jsonData);
        console.log('✅ BACKEND TEST - Successfully exported from backend');
      }
    } catch (error) {
      console.error('❌ BACKEND TEST - Failed to export from backend:', error);
    }
  };

  const importToBackend = async (jsonData: string) => {
    try {
      console.log('📥 BACKEND TEST - Importing to backend');
      const success = await importToBackend(jsonData);
      if (success) {
        setBackendInfo(prev => ({ ...prev, lastSync: new Date() }));
        console.log('✅ BACKEND TEST - Successfully imported to backend');
        // Recarregar página
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ BACKEND TEST - Failed to import to backend:', error);
    }
  };

  const getBackendStats = async () => {
    try {
      console.log('📊 BACKEND TEST - Getting backend stats');
      const stats = await getBackendStats();
      if (stats) {
        setBackendInfo(prev => ({
          ...prev,
          totalConfigs: stats.totalConfigs,
          version: stats.version,
          lastSync: stats.lastUpdated ? new Date(stats.lastUpdated) : null
        }));
        console.log('✅ BACKEND TEST - Backend stats retrieved:', stats);
      }
    } catch (error) {
      console.error('❌ BACKEND TEST - Failed to get backend stats:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Teste de Indicadores Técnicos - RSI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de Teste */}
          <div className="flex items-center gap-4">
            <Button
              onClick={generateData}
              disabled={isGenerating}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Gerando...' : 'Gerar Dados de Teste'}
            </Button>
            
            <Button
              onClick={runTest}
              variant="default"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Executar Teste RSI
            </Button>
            
            <Button
              onClick={() => setUseApiData(!useApiData)}
              variant={useApiData ? 'default' : 'outline'}
            >
              <Settings className="h-4 w-4 mr-2" />
              {useApiData ? 'API Data' : 'Static Data'}
            </Button>
          </div>

          {/* Status do Teste */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {testData.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Data Points
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {testResults.rsiDataPoints}
              </div>
              <div className="text-sm text-muted-foreground">
                RSI Points
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {testResults.cacheHits}
              </div>
              <div className="text-sm text-muted-foreground">
                Cache Hits
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {testResults.rsiCalculated ? '✅' : '⏳'}
              </div>
              <div className="text-sm text-muted-foreground">
                RSI Status
              </div>
            </div>
          </div>

          {/* Badges de Status */}
          <div className="flex items-center gap-2">
            <Badge variant={testData.length > 0 ? 'default' : 'secondary'}>
              {testData.length > 0 ? 'Data Ready' : 'No Data'}
            </Badge>
            
            <Badge variant={useApiData ? 'default' : 'outline'}>
              {useApiData ? 'API Mode' : 'Static Mode'}
            </Badge>
            
            <Badge variant={testResults.rsiCalculated ? 'default' : 'secondary'}>
              {testResults.rsiCalculated ? 'RSI Calculated' : 'RSI Pending'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Controles de Persistência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Persistência de Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status de Persistência */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {persistenceInfo.available ? '✅' : '❌'}
              </div>
              <div className="text-sm text-muted-foreground">
                Storage Available
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(persistenceInfo.used / 1024)}KB
              </div>
              <div className="text-sm text-muted-foreground">
                Used Space
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(persistenceInfo.percentage)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Usage
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(persistenceInfo.total / 1024)}KB
              </div>
              <div className="text-sm text-muted-foreground">
                Total Space
              </div>
            </div>
          </div>

          {/* Controles de Persistência */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={testPersistence}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Testar Persistência
            </Button>
            
            <Button
              onClick={exportConfigs}
              variant="outline"
              size="sm"
            >
              📤 Exportar
            </Button>
            
            <Button
              onClick={importConfigs}
              variant="outline"
              size="sm"
            >
              📥 Importar
            </Button>
            
            <Button
              onClick={clearConfigs}
              variant="destructive"
              size="sm"
            >
              🧹 Limpar
            </Button>
          </div>

          {/* Badges de Status */}
          <div className="flex items-center gap-2">
            <Badge variant={persistenceInfo.available ? 'default' : 'destructive'}>
              {persistenceInfo.available ? 'Storage OK' : 'Storage Error'}
            </Badge>
            
            <Badge variant={persistenceInfo.percentage > 80 ? 'destructive' : 'default'}>
              {persistenceInfo.percentage > 80 ? 'High Usage' : 'Normal Usage'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Controles de Backend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Sincronização com Backend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status do Backend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {backendInfo.connected ? '✅' : '❌'}
              </div>
              <div className="text-sm text-muted-foreground">
                Backend Connected
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {backendInfo.totalConfigs}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Configs
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {backendInfo.version || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">
                Version
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {backendInfo.lastSync ? '🕐' : '⏰'}
              </div>
              <div className="text-sm text-muted-foreground">
                Last Sync
              </div>
            </div>
          </div>

          {/* Controles de Backend */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={testBackendConnection}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            
            <Button
              onClick={saveToBackend}
              variant="default"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Save to Backend
            </Button>
            
            <Button
              onClick={loadFromBackend}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Load from Backend
            </Button>
            
            <Button
              onClick={clearFromBackend}
              variant="destructive"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Clear Backend
            </Button>
            
            <Button
              onClick={exportFromBackend}
              variant="outline"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Export Backend
            </Button>
            
            <Button
              onClick={getBackendStats}
              variant="outline"
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Get Stats
            </Button>
          </div>

          {/* Status do Backend */}
          {backendInfo.lastSync && (
            <div className="text-sm text-muted-foreground">
              Last sync: {backendInfo.lastSync.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico com Indicadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Gráfico com Indicadores Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LightweightLiquidationChartWithIndicators
            symbol="BTCUSDT"
            height={500}
            candleData={useApiData ? undefined : testData}
            useApiData={useApiData}
            timeframe="1h"
            showToolbar={true}
            showIndicatorControls={true}
            displaySymbol="BTCUSDT"
            symbolDescription="Bitcoin USD - Teste de Indicadores"
            liquidationLines={[
              { price: 45000, label: 'Liquidation Zone', color: '#ef4444' },
              { price: 55000, label: 'Resistance', color: '#f59e0b' }
            ]}
            takeProfitLines={[
              { price: 52000, label: 'Take Profit 1', color: '#10b981' },
              { price: 53000, label: 'Take Profit 2', color: '#10b981' }
            ]}
          />
        </CardContent>
      </Card>

      {/* Instruções de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções de Teste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Teste Básico de RSI:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Clique no botão "Gerar Dados de Teste" para criar dados simulados</li>
              <li>Clique no ícone de indicadores (Activity) no gráfico</li>
              <li>Ative o RSI no painel de controles</li>
              <li>Verifique se o pane RSI aparece abaixo do gráfico principal</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">2. Teste de Configuração:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Altere o período do RSI (padrão: 14)</li>
              <li>Mude a cor do RSI</li>
              <li>Ajuste a altura do pane</li>
              <li>Verifique se as mudanças são aplicadas em tempo real</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">3. Teste de Performance:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Execute "Executar Teste RSI" para simular cálculos</li>
              <li>Verifique os logs no console do navegador</li>
              <li>Monitore o uso de cache e performance</li>
              <li>Teste com dados da API vs dados estáticos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndicatorTestPage;
