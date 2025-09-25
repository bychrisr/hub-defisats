import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette,
  Eye,
  Contrast,
  Zap
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeManagerProps {
  className?: string;
}

export const ThemeManager = ({ className }: ThemeManagerProps) => {
  const { theme, setTheme } = useTheme();
  const [customTheme, setCustomTheme] = useState({
    primary: '#3773f5',
    secondary: '#8a2be6',
    accent: '#00ffdd',
    background: '#0a0a0a',
    foreground: '#ffffff',
  });

  const themes = [
    {
      id: 'light',
      name: 'Claro',
      icon: Sun,
      description: 'Tema claro padrão',
      colors: {
        primary: '#3773f5',
        secondary: '#8a2be6',
        accent: '#00ffdd',
        background: '#ffffff',
        foreground: '#000000',
      }
    },
    {
      id: 'dark',
      name: 'Escuro',
      icon: Moon,
      description: 'Tema escuro padrão',
      colors: {
        primary: '#3773f5',
        secondary: '#8a2be6',
        accent: '#00ffdd',
        background: '#0a0a0a',
        foreground: '#ffffff',
      }
    },
    {
      id: 'system',
      name: 'Sistema',
      icon: Monitor,
      description: 'Segue preferência do sistema',
      colors: {
        primary: '#3773f5',
        secondary: '#8a2be6',
        accent: '#00ffdd',
        background: 'auto',
        foreground: 'auto',
      }
    }
  ];

  const customThemes = [
    {
      id: 'ocean',
      name: 'Oceano',
      colors: {
        primary: '#0ea5e9',
        secondary: '#06b6d4',
        accent: '#10b981',
        background: '#0f172a',
        foreground: '#f1f5f9',
      }
    },
    {
      id: 'forest',
      name: 'Floresta',
      colors: {
        primary: '#059669',
        secondary: '#10b981',
        accent: '#84cc16',
        background: '#064e3b',
        foreground: '#ecfdf5',
      }
    },
    {
      id: 'sunset',
      name: 'Pôr do Sol',
      colors: {
        primary: '#f97316',
        secondary: '#ef4444',
        accent: '#fbbf24',
        background: '#1c1917',
        foreground: '#fef3c7',
      }
    },
    {
      id: 'purple',
      name: 'Roxo',
      colors: {
        primary: '#8b5cf6',
        secondary: '#a855f7',
        accent: '#ec4899',
        background: '#1e1b4b',
        foreground: '#f3e8ff',
      }
    }
  ];

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
  };

  const applyCustomTheme = (themeColors: any) => {
    const root = document.documentElement;
    
    Object.entries(themeColors).forEach(([key, value]) => {
      if (value !== 'auto') {
        root.style.setProperty(`--${key}`, value);
      }
    });
  };

  const resetToDefault = () => {
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--background');
    root.style.removeProperty('--foreground');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <span>Gerenciador de Temas</span>
          <Badge variant="outline" className="text-xs">
            {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Personalize a aparência da interface com diferentes temas e cores.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Temas Principais */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Temas Principais</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.id;
              
              return (
                <Button
                  key={themeOption.id}
                  variant={isActive ? "default" : "outline"}
                  className="flex flex-col items-center space-y-2 h-auto p-4"
                  onClick={() => handleThemeChange(themeOption.id)}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-center">
                    <div className="text-sm font-medium">{themeOption.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {themeOption.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Temas Personalizados */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Contrast className="h-4 w-4" />
            <span className="text-sm font-medium">Temas Personalizados</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {customThemes.map((customTheme) => (
              <Button
                key={customTheme.id}
                variant="outline"
                className="flex flex-col items-center space-y-2 h-auto p-4"
                onClick={() => applyCustomTheme(customTheme.colors)}
              >
                <div className="flex space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: customTheme.colors.primary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: customTheme.colors.secondary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: customTheme.colors.accent }}
                  />
                </div>
                <div className="text-sm font-medium">{customTheme.name}</div>
              </Button>
            ))}
          </div>
        </div>

        {/* Controles */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Controles</span>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefault}
              className="flex-1"
            >
              Resetar Padrão
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const root = document.documentElement;
                const computedStyle = getComputedStyle(root);
                console.log('Tema atual:', {
                  primary: computedStyle.getPropertyValue('--primary'),
                  secondary: computedStyle.getPropertyValue('--secondary'),
                  accent: computedStyle.getPropertyValue('--accent'),
                  background: computedStyle.getPropertyValue('--background'),
                  foreground: computedStyle.getPropertyValue('--foreground'),
                });
              }}
            >
              Debug
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Preview</div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="space-y-2">
              <div className="h-4 bg-primary rounded w-3/4"></div>
              <div className="h-3 bg-secondary rounded w-1/2"></div>
              <div className="h-3 bg-accent rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para seletor rápido de tema
export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', icon: Sun, label: 'Claro' },
    { id: 'dark', icon: Moon, label: 'Escuro' },
    { id: 'system', icon: Monitor, label: 'Sistema' },
  ];

  const currentTheme = themes.find(t => t.id === theme) || themes[1];

  const handleThemeToggle = () => {
    const themeOrder = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex] as 'light' | 'dark' | 'system');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleThemeToggle}
      className="flex items-center space-x-2"
    >
      <currentTheme.icon className="h-4 w-4" />
      <span className="hidden sm:inline">{currentTheme.label}</span>
    </Button>
  );
};
