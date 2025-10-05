// src/components/charts/IndicatorControls.tsx
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  BarChart3, 
  Activity, 
  Zap, 
  Settings,
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';
import { IndicatorType, IndicatorConfig } from '@/services/indicatorManager.service';

interface IndicatorControlsProps {
  enabledIndicators: IndicatorType[];
  configs: Record<IndicatorType, IndicatorConfig>;
  onToggleIndicator: (type: IndicatorType, enabled: boolean) => void;
  onUpdateConfig: (type: IndicatorType, config: Partial<IndicatorConfig>) => void;
  onRefreshIndicator: (type: IndicatorType) => void;
  onRefreshAll: () => void;
  onClearCache: () => void;
  isLoading?: boolean;
  lastUpdate?: number;
  cacheStats?: {
    size: number;
    entries: Array<{
      key: string;
      type: IndicatorType;
      age: number;
      accessCount: number;
      ttl: number;
    }>;
  };
}

const INDICATOR_INFO = {
  rsi: {
    name: 'RSI',
    description: 'Relative Strength Index - Mede momentum',
    icon: Activity,
    defaultPeriod: 14,
    minPeriod: 5,
    maxPeriod: 50,
    color: '#8b5cf6'
  },
  ema: {
    name: 'EMA',
    description: 'Exponential Moving Average - Tendência suavizada',
    icon: TrendingUp,
    defaultPeriod: 20,
    minPeriod: 5,
    maxPeriod: 100,
    color: '#f59e0b'
  },
  macd: {
    name: 'MACD',
    description: 'Moving Average Convergence Divergence - Momentum',
    icon: BarChart3,
    defaultPeriod: 12,
    minPeriod: 5,
    maxPeriod: 50,
    color: '#10b981'
  },
  bollinger: {
    name: 'Bollinger Bands',
    description: 'Bandas de volatilidade - Suporte/Resistência',
    icon: Zap,
    defaultPeriod: 20,
    minPeriod: 5,
    maxPeriod: 50,
    color: '#ef4444'
  },
  volume: {
    name: 'Volume',
    description: 'Volume de negociação - Liquidez',
    icon: BarChart3,
    defaultPeriod: 1,
    minPeriod: 1,
    maxPeriod: 1,
    color: '#6b7280'
  }
} as const;

export default function IndicatorControls({
  enabledIndicators,
  configs,
  onToggleIndicator,
  onUpdateConfig,
  onRefreshIndicator,
  onRefreshAll,
  onClearCache,
  isLoading = false,
  lastUpdate = 0,
  cacheStats
}: IndicatorControlsProps) {
  const [expandedIndicator, setExpandedIndicator] = useState<IndicatorType | null>(null);

  const handleToggleIndicator = useCallback((type: IndicatorType) => {
    const currentEnabled = enabledIndicators.includes(type);
    console.log(`🔘 TOGGLE CONTROL - ${type}:`, {
      currentEnabled,
      newState: !currentEnabled,
      enabledIndicators,
      configs: configs[type],
      timestamp: new Date().toISOString()
    });
    onToggleIndicator(type, !currentEnabled);
  }, [enabledIndicators, onToggleIndicator, configs]);

  const handlePeriodChange = useCallback((type: IndicatorType, period: number) => {
    onUpdateConfig(type, { period });
  }, [onUpdateConfig]);

  const handleColorChange = useCallback((type: IndicatorType, color: string) => {
    onUpdateConfig(type, { color });
  }, [onUpdateConfig]);

  const formatLastUpdate = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    const age = Date.now() - timestamp;
    if (age < 1000) return 'Just now';
    if (age < 60000) return `${Math.floor(age / 1000)}s ago`;
    return `${Math.floor(age / 60000)}m ago`;
  };

  const formatCacheAge = (age: number) => {
    const seconds = Math.floor(age / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Indicadores Técnicos
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshAll}
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCache}
              className="h-8"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cache
            </Button>
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant={isLoading ? 'default' : 'secondary'}>
              {isLoading ? 'Calculating...' : 'Ready'}
            </Badge>
            <span>Last update: {formatLastUpdate(lastUpdate)}</span>
          </div>
          
          {cacheStats && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Cache: {cacheStats.size} entries
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lista de Indicadores */}
        {Object.entries(INDICATOR_INFO).map(([key, info]) => {
          const type = key as IndicatorType;
          const isEnabled = enabledIndicators.includes(type);
          const config = configs[type] || { enabled: false, period: info.defaultPeriod };
          const isExpanded = expandedIndicator === type;
          const Icon = info.icon;

          return (
            <div key={type} className="border rounded-lg p-3 space-y-3">
              {/* Header do Indicador */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" style={{ color: info.color }} />
                  <div>
                    <div className="font-medium">{info.name}</div>
                    <div className="text-xs text-muted-foreground">{info.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggleIndicator(type)}
                    disabled={isLoading}
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedIndicator(isExpanded ? null : type)}
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  
                  {isEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRefreshIndicator(type)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Configurações Expandidas */}
              {isExpanded && isEnabled && (
                <div className="space-y-3 pt-3 border-t">
                  {/* Período */}
                  {type !== 'volume' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Período: {config.period || info.defaultPeriod}
                      </Label>
                      <Slider
                        value={[config.period || info.defaultPeriod]}
                        onValueChange={([value]) => handlePeriodChange(type, value)}
                        min={info.minPeriod}
                        max={info.maxPeriod}
                        step={1}
                        className="w-full"
                        disabled={isLoading}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{info.minPeriod}</span>
                        <span>{info.maxPeriod}</span>
                      </div>
                    </div>
                  )}

                  {/* Cor */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cor</Label>
                    <div className="flex gap-2">
                      {[
                        { name: 'Padrão', value: info.color },
                        { name: 'Azul', value: '#3b82f6' },
                        { name: 'Verde', value: '#10b981' },
                        { name: 'Vermelho', value: '#ef4444' },
                        { name: 'Roxo', value: '#8b5cf6' },
                        { name: 'Laranja', value: '#f59e0b' }
                      ].map((colorOption, index) => (
                        <button
                          key={`${type}-color-${index}-${colorOption.value}`}
                          onClick={() => handleColorChange(type, colorOption.value)}
                          className={`w-6 h-6 rounded border-2 ${
                            (config.color || info.color) === colorOption.value
                              ? 'border-gray-900'
                              : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: colorOption.value }}
                          title={colorOption.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Altura do Pane */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Altura do Pane: {config.height || 100}px
                    </Label>
                    <Slider
                      value={[config.height || 100]}
                      onValueChange={([value]) => onUpdateConfig(type, { height: value })}
                      min={50}
                      max={200}
                      step={10}
                      className="w-full"
                      disabled={isLoading}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50px</span>
                      <span>200px</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status do Cache */}
              {cacheStats && isEnabled && (
                <div className="text-xs text-muted-foreground">
                  {cacheStats.entries
                    .filter(entry => entry.type === type)
                    .map(entry => (
                      <div key={entry.key} className="flex justify-between">
                        <span>Cache: {formatCacheAge(entry.age)}</span>
                        <span>Access: {entry.accessCount}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Info sobre Cache */}
        {cacheStats && cacheStats.size > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>Cache: {cacheStats.size} entradas ativas</span>
            </div>
    </div>
        )}
      </CardContent>
    </Card>
  );
}