import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log('🎨 THEME TOGGLE - Current theme:', theme);
    toggleTheme();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="w-full justify-start gap-2"
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4" />
          Modo Escuro
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          Modo Claro
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
