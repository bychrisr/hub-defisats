import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Verificar se há tema salvo no localStorage
    const savedTheme = localStorage.getItem('coingecko-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Verificar preferência do sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // Se não conseguir detectar, definir padrão como dark
    return 'dark';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Aplicar tema ao documento com transição suave
    console.log('🎨 COINGECKO THEME - Applying theme:', theme);
    
    // Adicionar classe de transição para suavizar a mudança
    document.documentElement.classList.add('theme-transitioning');
    
    // Aplicar o tema
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = theme;
    
    // Salvar no localStorage
    localStorage.setItem('coingecko-theme', theme);
    
    // Remover classe de transição após um delay
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);
    
    // Disparar evento customizado para gráficos e outros componentes
    window.dispatchEvent(new CustomEvent('coingecko-theme-change', { 
      detail: { theme } 
    }));
  }, [theme]);

  // Listener para mudanças na preferência do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Só aplicar se não houver tema salvo no localStorage
      if (!localStorage.getItem('coingecko-theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook para obter cores baseadas no tema atual
export const useThemeColors = () => {
  const { theme } = useTheme();
  
  return {
    // Cores principais (consistentes)
    primary: '#3773f5',
    secondary: '#f5ac37',
    success: '#0ecb81',
    destructive: '#f6465d',
    
    // Cores baseadas no tema
    background: theme === 'light' ? '#ffffff' : '#0d0f13',
    textPrimary: theme === 'light' ? '#13161c' : '#f1f3f4',
    textSecondary: theme === 'light' ? '#62666f' : '#a8b0b8',
    border: theme === 'light' ? '#e6e8ec' : '#21262d',
    card: theme === 'light' ? '#f9fafb' : '#16191d',
    header: theme === 'light' ? '#f6f7f8' : '#16191d',
  };
};

// Hook para classes CSS baseadas no tema
export const useThemeClasses = () => {
  const { theme } = useTheme();
  
  return {
    // Classes de texto
    textPositive: 'text-success',
    textNegative: 'text-destructive',
    textPrimary: 'text-text-primary',
    textSecondary: 'text-text-secondary',
    
    // Classes de fundo
    bgCard: 'bg-card',
    bgHeader: 'bg-bg-header',
    bgPrimary: 'bg-bg-primary',
    
    // Classes de borda
    border: 'border-border',
    borderLight: 'border-border-light',
    
    // Classes de transição
    transition: 'transition-all duration-300 ease-in-out',
    
    // Classes específicas do CoinGecko
    coingeckoCard: 'coingecko-card',
    coingeckoHeader: 'coingecko-header',
    coingeckoPositive: 'coingecko-positive',
    coingeckoNegative: 'coingecko-negative',
    coingeckoPrimary: 'coingecko-primary',
    coingeckoSecondary: 'coingecko-secondary',
  };
};