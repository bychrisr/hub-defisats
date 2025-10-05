// src/pages/EMATestPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEMA } from '@/hooks/useEMA';
import { EMACalculationService } from '@/services/emaCalculation.service';
import { BarData } from '@/services/emaCalculation.service';
import { TrendingUp, Settings, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// Dados de teste simulados
const generateTestData = (count: number = 100): BarData[] => {
  const data: BarData[] = [];
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

const EMATestPage: React.FC = () => {
  const [testData, setTestData] = useState<BarData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testResults, setTestResults] = useState<{
    implementationTest: boolean;
    calculationTest: boolean;
    validationTest: boolean;
  }>({
    implementationTest: false,
    calculationTest: false,
    validationTest: false
  });

  // Hook para EMA
  const {
    emaResult,
    isLoading,
    error,
    lastUpdate,
    config,
    updateConfig,
    calculateEMA,
    clearError,
    stats
  } = useEMA({
    data: testData,
    initialConfig: {
      enabled: true,
      period: 20,
      color: '#f59e0b',
      lineWidth: 2
    },
    autoUpdate: true,
    updateInterval: 2000
  });

  // Gerar dados de teste
  const generateData = async () => {
    setIsGenerating(true);
    console.log('📊 EMA TEST - Generating test data');
    
    // Simular delay de geração
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = generateTestData(100);
    setTestData(data);
    
    console.log(`✅ EMA TEST - Generated ${data.length} data points`);
    setIsGenerating(false);
  };

  // Executar testes
  const runTests = async () => {
    console.log('🧪 EMA TEST - Running all tests');
    
    // Teste 1: Implementação
    const implementationTest = EMACalculationService.testImplementation();
    console.log(`🧪 EMA TEST - Implementation test: ${implementationTest ? 'PASSED' : 'FAILED'}`);
    
    // Teste 2: Cálculo com dados reais
    let calculationTest = false;
    if (testData.length > 0) {
      try {
        const emaData = EMACalculationService.calculateEMA(testData, { period: 20 });
        calculationTest = emaData.length > 0;
        console.log(`🧪 EMA TEST - Calculation test: ${calculationTest ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        console.error('❌ EMA TEST - Calculation test failed:', error);
      }
    }
    
    // Teste 3: Validação
    const validation = EMACalculationService.validateData(testData, 20);
    const validationTest = validation.isValid;
    console.log(`🧪 EMA TEST - Validation test: ${validationTest ? 'PASSED' : 'FAILED'}`);
    
    setTestResults({
      implementationTest,
      calculationTest,
      validationTest
    });
  };

  // Efeito para gerar dados iniciais
  useEffect(() => {
    generateData();
  }, []);

  // Efeito para executar testes quando dados mudam
  useEffect(() => {
    if (testData.length > 0) {
      runTests();
    }
  }, [testData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">EMA Indicator Test</h1>
          <p className="text-muted-foreground">Teste isolado da implementação EMA</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={generateData} 
            disabled={isGenerating}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Gerando...' : 'Gerar Dados'}
          </Button>
          <Button onClick={runTests} variant="default">
            <CheckCircle className="w-4 h-4 mr-2" />
            Executar Testes
          </Button>
        </div>
      </div>

      {/* Status dos Testes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Status dos Testes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {testResults.implementationTest ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span>Implementação</span>
            </div>
            <div className="flex items-center gap-2">
              {testResults.calculationTest ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span>Cálculo</span>
            </div>
            <div className="flex items-center gap-2">
              {testResults.validationTest ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span>Validação</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações da EMA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Configurações da EMA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enabled">Habilitado</Label>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => updateConfig({ enabled: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Input
                id="period"
                type="number"
                value={config.period}
                onChange={(e) => updateConfig({ period: parseInt(e.target.value) || 20 })}
                min="1"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                type="color"
                value={config.color}
                onChange={(e) => updateConfig({ color: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lineWidth">Espessura</Label>
              <Input
                id="lineWidth"
                type="number"
                value={config.lineWidth}
                onChange={(e) => updateConfig({ lineWidth: parseInt(e.target.value) || 2 })}
                min="1"
                max="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados da EMA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resultados da EMA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Calculando EMA...
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle className="w-4 h-4" />
              {error}
              <Button size="sm" variant="outline" onClick={clearError}>
                Limpar
              </Button>
            </div>
          )}
          
          {emaResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Pontos de Dados</Label>
                  <div className="text-2xl font-bold">{stats.dataPoints}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Primeiro Valor</Label>
                  <div className="text-2xl font-bold">
                    {stats.firstValue ? stats.firstValue.toFixed(2) : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Último Valor</Label>
                  <div className="text-2xl font-bold">
                    {stats.lastValue ? stats.lastValue.toFixed(2) : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Período</Label>
                  <div className="text-2xl font-bold">{config.period}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Valor Mínimo</Label>
                  <div className="text-lg">
                    {stats.minValue ? stats.minValue.toFixed(2) : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor Máximo</Label>
                  <div className="text-lg">
                    {stats.maxValue ? stats.maxValue.toFixed(2) : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor Médio</Label>
                  <div className="text-lg">
                    {stats.averageValue ? stats.averageValue.toFixed(2) : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Última Atualização: {new Date(lastUpdate).toLocaleTimeString()}
                </Badge>
                <Badge variant={emaResult.valid ? "default" : "destructive"}>
                  {emaResult.valid ? "Válido" : "Inválido"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Pontos de Dados:</span>
              <Badge>{testData.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Período de Tempo:</span>
              <Badge>
                {testData.length > 0 
                  ? `${Math.round((testData[testData.length - 1]?.time - testData[0]?.time) / 3600)} horas`
                  : 'N/A'
                }
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Preço Inicial:</span>
              <Badge>
                {testData.length > 0 ? `$${testData[0]?.close.toFixed(2)}` : 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Preço Final:</span>
              <Badge>
                {testData.length > 0 ? `$${testData[testData.length - 1]?.close.toFixed(2)}` : 'N/A'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EMATestPage;
