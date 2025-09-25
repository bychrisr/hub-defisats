import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Accessibility, 
  Eye, 
  Type, 
  MousePointer, 
  Keyboard,
  Volume2,
  Contrast,
  Zap
} from 'lucide-react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface AccessibilitySettingsProps {
  className?: string;
}

export const AccessibilitySettings = ({ className }: AccessibilitySettingsProps) => {
  const {
    reducedMotion,
    highContrast,
    fontSize,
    screenReader,
    keyboardNavigation,
    focusVisible,
    setFontSize,
    toggleHighContrast,
    toggleFocusVisible,
    announce,
  } = useAccessibility();

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    announce(`Tamanho da fonte alterado para ${size}`);
  };

  const handleHighContrastToggle = () => {
    toggleHighContrast();
    announce(`Alto contraste ${highContrast ? 'desativado' : 'ativado'}`);
  };

  const handleFocusVisibleToggle = () => {
    toggleFocusVisible();
    announce(`Indicador de foco ${focusVisible ? 'desativado' : 'ativado'}`);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Accessibility className="h-5 w-5" />
          <span>Configurações de Acessibilidade</span>
          <Badge variant="outline" className="text-xs">
            WCAG 2.1
          </Badge>
        </CardTitle>
        <CardDescription>
          Personalize a interface para melhorar sua experiência de uso.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Tamanho da Fonte */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Type className="h-4 w-4" />
            <span className="text-sm font-medium">Tamanho da Fonte</span>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={fontSize === 'small' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFontSizeChange('small')}
            >
              Pequeno
            </Button>
            <Button
              variant={fontSize === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFontSizeChange('medium')}
            >
              Médio
            </Button>
            <Button
              variant={fontSize === 'large' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFontSizeChange('large')}
            >
              Grande
            </Button>
          </div>
        </div>

        {/* Alto Contraste */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Contrast className="h-4 w-4" />
            <div>
              <span className="text-sm font-medium">Alto Contraste</span>
              <p className="text-xs text-muted-foreground">
                Aumenta o contraste das cores
              </p>
            </div>
          </div>
          <Switch
            checked={highContrast}
            onCheckedChange={handleHighContrastToggle}
          />
        </div>

        {/* Indicador de Foco */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MousePointer className="h-4 w-4" />
            <div>
              <span className="text-sm font-medium">Indicador de Foco</span>
              <p className="text-xs text-muted-foreground">
                Destaca elementos em foco
              </p>
            </div>
          </div>
          <Switch
            checked={focusVisible}
            onCheckedChange={handleFocusVisibleToggle}
          />
        </div>

        {/* Status do Sistema */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Status do Sistema</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <Zap className="h-3 w-3" />
              <span>Movimento Reduzido:</span>
              <Badge variant={reducedMotion ? "default" : "secondary"}>
                {reducedMotion ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Volume2 className="h-3 w-3" />
              <span>Leitor de Tela:</span>
              <Badge variant={screenReader ? "default" : "secondary"}>
                {screenReader ? 'Detectado' : 'Não detectado'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Keyboard className="h-3 w-3" />
              <span>Navegação por Teclado:</span>
              <Badge variant={keyboardNavigation ? "default" : "secondary"}>
                {keyboardNavigation ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Contrast className="h-3 w-3" />
              <span>Alto Contraste:</span>
              <Badge variant={highContrast ? "default" : "secondary"}>
                {highContrast ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Atalhos de Teclado */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Keyboard className="h-4 w-4" />
            <span className="text-sm font-medium">Atalhos de Teclado</span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Navegar entre elementos:</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Tab</kbd>
            </div>
            <div className="flex justify-between">
              <span>Ativar elemento:</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
            </div>
            <div className="flex justify-between">
              <span>Fechar modal/menu:</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
            </div>
            <div className="flex justify-between">
              <span>Alternar configurações:</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + A</kbd>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para indicador de acessibilidade na barra superior
export const AccessibilityStatus = () => {
  const { reducedMotion, highContrast, fontSize, keyboardNavigation } = useAccessibility();

  const activeFeatures = [];
  
  if (reducedMotion) activeFeatures.push('RM');
  if (highContrast) activeFeatures.push('HC');
  if (fontSize === 'large') activeFeatures.push('LF');
  if (keyboardNavigation) activeFeatures.push('KB');

  if (activeFeatures.length === 0) return null;

  return (
    <div className="flex items-center space-x-1">
      <Accessibility className="h-3 w-3" />
      <div className="flex space-x-1">
        {activeFeatures.map((feature) => (
          <Badge key={feature} variant="outline" className="text-xs px-1 py-0">
            {feature}
          </Badge>
        ))}
      </div>
    </div>
  );
};
