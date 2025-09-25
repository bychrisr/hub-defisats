import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Settings, 
  Shield, 
  Target, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigChange {
  old: Record<string, any>;
  new: Record<string, any>;
}

interface ConfigChangeDisplayProps {
  configChanges: ConfigChange;
  automationType: string;
  changeType: string;
  timestamp: string;
}

export const ConfigChangeDisplay: React.FC<ConfigChangeDisplayProps> = ({
  configChanges,
  automationType,
  changeType,
  timestamp
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Função para detectar mudanças específicas
  const getChanges = () => {
    const oldConfig = configChanges.old || {};
    const newConfig = configChanges.new || {};
    const changes = [];

    if (automationType === 'margin_guard') {
      if (oldConfig.margin_threshold !== newConfig.margin_threshold) {
        changes.push({
          field: 'Threshold',
          old: oldConfig.margin_threshold,
          new: newConfig.margin_threshold,
          unit: '%',
          icon: TrendingUp,
          type: 'numeric'
        });
      }
      if (oldConfig.new_liquidation_distance !== newConfig.new_liquidation_distance) {
        changes.push({
          field: 'Liquidation Distance',
          old: oldConfig.new_liquidation_distance,
          new: newConfig.new_liquidation_distance,
          unit: '%',
          icon: TrendingDown,
          type: 'numeric'
        });
      }
      if (oldConfig.action !== newConfig.action) {
        changes.push({
          field: 'Action',
          old: oldConfig.action,
          new: newConfig.action,
          unit: '',
          icon: Settings,
          type: 'text'
        });
      }
    }

    if (automationType === 'tp_sl') {
      if (oldConfig.take_profit_percentage !== newConfig.take_profit_percentage) {
        changes.push({
          field: 'Take Profit',
          old: oldConfig.take_profit_percentage,
          new: newConfig.take_profit_percentage,
          unit: '%',
          icon: TrendingUp,
          type: 'numeric'
        });
      }
      if (oldConfig.stop_loss_percentage !== newConfig.stop_loss_percentage) {
        changes.push({
          field: 'Stop Loss',
          old: oldConfig.stop_loss_percentage,
          new: newConfig.stop_loss_percentage,
          unit: '%',
          icon: TrendingDown,
          type: 'numeric'
        });
      }
      if (oldConfig.trailing_stop !== newConfig.trailing_stop) {
        changes.push({
          field: 'Trailing Stop',
          old: oldConfig.trailing_stop ? 'Enabled' : 'Disabled',
          new: newConfig.trailing_stop ? 'Enabled' : 'Disabled',
          unit: '',
          icon: Settings,
          type: 'boolean'
        });
      }
      if (oldConfig.trailing_distance !== newConfig.trailing_distance) {
        changes.push({
          field: 'Trailing Distance',
          old: oldConfig.trailing_distance,
          new: newConfig.trailing_distance,
          unit: '%',
          icon: TrendingUp,
          type: 'numeric'
        });
      }
    }

    return changes;
  };

  const changes = getChanges();
  const hasChanges = changes.length > 0;

  // Resumo inteligente
  const getSummary = () => {
    if (!hasChanges) return 'Configuration updated';
    
    if (changes.length === 1) {
      const change = changes[0];
      return `${change.field}: ${change.old}${change.unit} → ${change.new}${change.unit}`;
    }
    
    return `${changes.length} parameters updated`;
  };

  // Ícone da automação
  const getAutomationIcon = () => {
    switch (automationType) {
      case 'margin_guard':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'tp_sl':
        return <Target className="h-4 w-4 text-green-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  // Badge de tipo de mudança
  const getChangeTypeBadge = () => {
    switch (changeType) {
      case 'activation':
        return <Badge className="bg-green-500 text-white">Activated</Badge>;
      case 'deactivation':
        return <Badge className="bg-red-500 text-white">Deactivated</Badge>;
      case 'config_update':
        return <Badge className="bg-blue-500 text-white">Updated</Badge>;
      default:
        return <Badge variant="outline">{changeType}</Badge>;
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-lg">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-background/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getAutomationIcon()}
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {automationType === 'margin_guard' ? 'Margin Guard' :
                     automationType === 'tp_sl' ? 'Take Profit / Stop Loss' :
                     automationType}
                  </CardTitle>
                  <p className="text-sm text-text-secondary">
                    {getSummary()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getChangeTypeBadge()}
                {hasChanges && (
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        {hasChanges && (
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {changes.map((change, index) => {
                  const IconComponent = change.icon;
                  const isIncrease = change.type === 'numeric' && change.new > change.old;
                  const isDecrease = change.type === 'numeric' && change.new < change.old;
                  
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/20">
                      <div className="p-2 rounded-lg bg-background/30">
                        <IconComponent className={cn(
                          "h-4 w-4",
                          isIncrease ? "text-green-500" : 
                          isDecrease ? "text-red-500" : 
                          "text-blue-500"
                        )} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-text-primary">
                          {change.field}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {change.old}{change.unit}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-text-secondary" />
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {change.new}{change.unit}
                          </Badge>
                        </div>
                      </div>
                      
                      {change.type === 'numeric' && (
                        <div className="text-right">
                          <div className={cn(
                            "text-sm font-medium",
                            isIncrease ? "text-green-600" : 
                            isDecrease ? "text-red-600" : 
                            "text-text-secondary"
                          )}>
                            {isIncrease ? '+' : isDecrease ? '-' : ''}
                            {Math.abs(change.new - change.old)}{change.unit}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {isIncrease ? 'increase' : isDecrease ? 'decrease' : 'no change'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-3 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Info className="h-3 w-3" />
                  <span>Changed on {new Date(timestamp).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  );
};
