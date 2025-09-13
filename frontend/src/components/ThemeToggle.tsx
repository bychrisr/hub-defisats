import React from 'react';
import { useTheme, useThemeClasses } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const themeClasses = useThemeClasses();

  const handleToggle = () => {
    console.log('🎨 COINGECKO THEME TOGGLE - Current theme:', theme);
    toggleTheme();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={`w-full justify-start gap-2 ${themeClasses.transition} hover:bg-primary/10`}
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4 text-primary" />
          <span className={themeClasses.textPrimary}>Modo Escuro</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 text-secondary" />
          <span className={themeClasses.textPrimary}>Modo Claro</span>
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
