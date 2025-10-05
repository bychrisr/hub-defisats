// src/components/EMATestComponent.tsx
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

interface EMATestComponentProps {
  data: BarData[];
  onEMAResult?: (result: any) => void;
}

const EMATestComponent: React.FC<EMATestComponentProps> = ({ data, onEMAResult }) => {
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
    data,
    initialConfig: {
      enabled: true,
      period: 20,
      color: '#f59e0b',
      lineWidth: 2
    },
    autoUpdate: true,
    updateInterval: 2000
  });

  // Executar testes
  const runTests = async () => {
    console.log('🧪 EMA COMPONENT - Running tests');
    
    // Teste 1: Implementação
    const implementationTest = EMACalculationService.testImplementation();
    console.log(`🧪 EMA COMPONENT - Implementation test: ${implementationTest ? 'PASSED' : 'FAILED'}`);
    
    // Teste 2: Cálculo com dados reais
    let calculationTest = false;
    if (data.length > 0) {
      try {
        const emaData = EMACalculationService.calculateEMA(data, { period: 20 });
        calculationTest = emaData.length > 0;
        console.log(`🧪 EMA COMPONENT - Calculation test: ${calculationTest ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        console.error('❌ EMA COMPONENT - Calculation test failed:', error);
      }
    }
    
    // Teste 3: Validação
    const validation = EMACalculationService.validateData(data, 20);
    const validationTest = validation.isValid;
    console.log(`🧪 EMA COMPONENT - Validation test: ${validationTest ? 'PASSED' : 'FAILED'}`);
    
    setTestResults({
      implementationTest,
      calculationTest,
      validationTest
    });
  };

  // Efeito para executar testes quando dados mudam
  useEffect(() => {
    if (data.length > 0) {
      runTests();
    }
  }, [data]);

  // Efeito para notificar resultado
  useEffect(() => {
    if (emaResult && onEMAResult) {
      onEMAResult(emaResult);
    }
  }, [emaResult, onEMAResult]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          EMA Indicator Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status dos Testes */}
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

        {/* Configurações da EMA */}
        <div className="space-y-4">
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
        </div>

        {/* Resultados da EMA */}
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Calculando EMA...
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 text-red-600">
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
        </div>

        {/* Botão de Teste */}
        <div className="flex justify-end">
          <Button onClick={runTests} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Executar Testes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EMATestComponent;
