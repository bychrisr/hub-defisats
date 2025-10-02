/**
 * Componente de Configuração do RSI
 * Interface para configurar parâmetros do RSI
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RSIConfig } from '@/services/technicalIndicators.service';
import { X, Check, RotateCcw } from 'lucide-react';

interface RSIConfigProps {
  config: RSIConfig;
  enabled: boolean;
  onConfigChange: (config: RSIConfig) => void;
  onEnabledChange: (enabled: boolean) => void;
  onClose?: () => void;
  onReset?: () => void;
}

export const RSIConfigComponent: React.FC<RSIConfigProps> = ({
  config,
  enabled,
  onConfigChange,
  onEnabledChange,
  onClose,
  onReset
}) => {
  const handlePeriodChange = (value: number[]) => {
    onConfigChange({
      ...config,
      period: value[0]
    });
  };

  const handleOverboughtChange = (value: number[]) => {
    onConfigChange({
      ...config,
      overbought: value[0]
    });
  };

  const handleOversoldChange = (value: number[]) => {
    onConfigChange({
      ...config,
      oversold: value[0]
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">RSI Configuration</CardTitle>
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
      </CardHeader>
      
      {enabled && (
        <CardContent className="space-y-4">
          {/* Período */}
          <div className="space-y-2">
            <Label htmlFor="rsi-period" className="text-xs">
              Period: {config.period}
            </Label>
            <Slider
              id="rsi-period"
              min={2}
              max={50}
              step={1}
              value={[config.period]}
              onValueChange={handlePeriodChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2</span>
              <span>50</span>
            </div>
          </div>

          {/* Overbought */}
          <div className="space-y-2">
            <Label htmlFor="rsi-overbought" className="text-xs">
              Overbought: {config.overbought}%
            </Label>
            <Slider
              id="rsi-overbought"
              min={60}
              max={90}
              step={1}
              value={[config.overbought]}
              onValueChange={handleOverboughtChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>60%</span>
              <span>90%</span>
            </div>
          </div>

          {/* Oversold */}
          <div className="space-y-2">
            <Label htmlFor="rsi-oversold" className="text-xs">
              Oversold: {config.oversold}%
            </Label>
            <Slider
              id="rsi-oversold"
              min={10}
              max={40}
              step={1}
              value={[config.oversold]}
              onValueChange={handleOversoldChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10%</span>
              <span>40%</span>
            </div>
          </div>

          {/* Informações */}
          <div className="pt-2 border-t">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                RSI
              </Badge>
              <Badge variant="outline" className="text-xs">
                Momentum
              </Badge>
              <Badge variant="outline" className="text-xs">
                Oscillator
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Relative Strength Index measures momentum. Values above {config.overbought}% indicate overbought conditions, 
              values below {config.oversold}% indicate oversold conditions.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default RSIConfigComponent;
