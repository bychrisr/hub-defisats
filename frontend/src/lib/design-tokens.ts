/**
 * CoinGecko Inspired Design Tokens
 * 
 * Este arquivo contém todos os tokens de design inspirados no CoinGecko,
 * incluindo cores, tipografia, espaçamentos e outros elementos visuais.
 * 
 * Mantém a tipografia Inter conforme especificado.
 */

export const designTokens = {
  // ===== CORES PRIMÁRIAS =====
  colors: {
    // Cores principais (consistentes em ambos os temas)
    primary: '#3773f5',      // CoinGecko Blue
    secondary: '#f5ac37',    // CoinGecko Orange
    success: '#0ecb81',      // CoinGecko Green (valores positivos)
    destructive: '#f6465d',  // CoinGecko Red (valores negativos)
    
    // Modo Claro
    light: {
      background: '#ffffff',           // Fundo principal
      textPrimary: '#13161c',          // Texto principal
      textSecondary: '#62666f',        // Texto secundário
      border: '#e6e8ec',               // Linhas/divisores
      header: '#f6f7f8',               // Fundo cabeçalho tabela
      card: '#f9fafb',                 // Fundo cards (alternativo)
      cardAlt: '#f6f7f8',              // Fundo cards alternativo
    },
    
    // Modo Escuro
    dark: {
      background: '#0d0f13',           // Fundo principal
      card: '#16191d',                 // Fundo cards/containers
      cardAlt: '#1a1d22',              // Fundo cards (alternativo)
      textPrimary: '#f1f3f4',          // Texto principal (mais claro para melhor contraste)
      textSecondary: '#a8b0b8',        // Texto secundário (mais claro para melhor contraste)
      border: '#21262d',               // Linhas/divisores
      header: '#16191d',               // Fundo cabeçalho tabela
    },
  },

  // ===== TIPOGRAFIA =====
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // ===== ESPAÇAMENTOS =====
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // ===== BORDAS =====
  borderRadius: {
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    full: '9999px',
  },

  // ===== SOMBRAS =====
  shadows: {
    sm: '0 1px 2px 0 rgba(55, 115, 245, 0.05)',
    md: '0 4px 6px -1px rgba(55, 115, 245, 0.1)',
    lg: '0 10px 15px -3px rgba(55, 115, 245, 0.1)',
    glow: '0 0 20px rgba(55, 115, 245, 0.3)',
  },

  // ===== GRADIENTES =====
  gradients: {
    primary: 'linear-gradient(135deg, #3773f5, #2c5ce6)',
    success: 'linear-gradient(135deg, #0ecb81, #0bb870)',
    warning: 'linear-gradient(135deg, #f5ac37, #e69a2e)',
    hero: 'linear-gradient(135deg, #3773f5, #f5ac37)',
  },

  // ===== ANIMAÇÕES =====
  transitions: {
    fast: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // ===== BREAKPOINTS =====
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// ===== UTILITÁRIOS DE COR =====
export const colorUtils = {
  /**
   * Retorna a cor apropriada para valores positivos
   */
  positive: (theme: 'light' | 'dark') => designTokens.colors.success,
  
  /**
   * Retorna a cor apropriada para valores negativos
   */
  negative: (theme: 'light' | 'dark') => designTokens.colors.destructive,
  
  /**
   * Retorna a cor primária
   */
  primary: () => designTokens.colors.primary,
  
  /**
   * Retorna a cor secundária
   */
  secondary: () => designTokens.colors.secondary,
  
  /**
   * Retorna a cor de fundo baseada no tema
   */
  background: (theme: 'light' | 'dark') => 
    theme === 'light' ? designTokens.colors.light.background : designTokens.colors.dark.background,
  
  /**
   * Retorna a cor de texto primária baseada no tema
   */
  textPrimary: (theme: 'light' | 'dark') => 
    theme === 'light' ? designTokens.colors.light.textPrimary : designTokens.colors.dark.textPrimary,
  
  /**
   * Retorna a cor de texto secundária baseada no tema
   */
  textSecondary: (theme: 'light' | 'dark') => 
    theme === 'light' ? designTokens.colors.light.textSecondary : designTokens.colors.dark.textSecondary,
  
  /**
   * Retorna a cor de borda baseada no tema
   */
  border: (theme: 'light' | 'dark') => 
    theme === 'light' ? designTokens.colors.light.border : designTokens.colors.dark.border,
  
  /**
   * Retorna a cor de fundo de card baseada no tema
   */
  card: (theme: 'light' | 'dark') => 
    theme === 'light' ? designTokens.colors.light.card : designTokens.colors.dark.card,
};

// ===== CLASSES CSS UTILITÁRIAS =====
export const cssClasses = {
  // Cores de texto
  textPositive: 'text-success',
  textNegative: 'text-destructive',
  textPrimary: 'text-primary',
  textSecondary: 'text-secondary',
  
  // Cores de fundo
  bgCard: 'bg-card',
  bgHeader: 'bg-bg-header',
  
  // Bordas
  border: 'border-border',
  borderLight: 'border-border-light',
  
  // Transições
  transition: 'transition-all duration-300 ease-in-out',
  transitionFast: 'transition-all duration-200 ease-in-out',
  
  // Sombras
  shadow: 'shadow-coingecko-md',
  shadowGlow: 'shadow-glow',
  
  // Gradientes
  gradientPrimary: 'bg-gradient-to-r from-primary to-secondary',
  gradientSuccess: 'bg-gradient-to-r from-success to-success/80',
  gradientWarning: 'bg-gradient-to-r from-warning to-warning/80',
} as const;

export default designTokens;
