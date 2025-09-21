/**
 * Axisor Design Tokens
 * 
 * Este arquivo contém todos os tokens de design da marca Axisor,
 * incluindo cores, tipografia, espaçamentos e outros elementos visuais.
 * 
 * Tema principal: Dark Mode com paleta tech futurista
 */

export const designTokens = {
  // ===== CORES PRIMÁRIAS =====
  colors: {
    // Cores principais (tema dark principal)
    primary: '#3773F5',      // Axisor Blue
    secondary: '#8A2BE2',    // Axisor Purple
    accent: '#00FFDD',       // Axisor Cyan
    success: '#0ECB81',      // Axisor Green (valores positivos)
    destructive: '#F6465D',  // Axisor Red (valores negativos)
    
    // Modo Escuro (Principal)
    dark: {
      background: '#0B0F1A',           // Fundo principal
      card: '#1A1F2E',                 // Fundo cards/containers
      cardAlt: '#242B3D',              // Fundo cards (alternativo)
      textPrimary: '#E6E6E6',          // Texto principal
      textSecondary: '#B8BCC8',        // Texto secundário
      border: '#2A3441',               // Linhas/divisores
      header: '#1A1F2E',               // Fundo cabeçalho tabela
    },
    
    // Modo Claro (Secundário)
    light: {
      background: '#FFFFFF',           // Fundo principal
      textPrimary: '#0B0F1A',          // Texto principal
      textSecondary: '#4A5568',        // Texto secundário
      border: '#E2E8F0',               // Linhas/divisores
      header: '#F7FAFC',               // Fundo cabeçalho tabela
      card: '#FFFFFF',                 // Fundo cards
      cardAlt: '#F7FAFC',              // Fundo cards alternativo
    },
  },

  // ===== TIPOGRAFIA =====
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],           // Corpo de texto e menus
      heading: ['Rubik', 'Inter', 'system-ui', 'sans-serif'], // Títulos (h1, h2, h3)
      mono: ['Source Code Pro', 'JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'], // Números e dashboards
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
    primary: 'linear-gradient(135deg, #3773F5, #8A2BE2)',      // Azul → Roxo
    secondary: 'linear-gradient(135deg, #8A2BE2, #00FFDD)',    // Roxo → Ciano
    accent: 'linear-gradient(135deg, #00FFDD, #3773F5)',       // Ciano → Azul
    success: 'linear-gradient(135deg, #0ECB81, #00FFDD)',      // Verde → Ciano
    hero: 'linear-gradient(135deg, #3773F5, #8A2BE2, #00FFDD)', // Azul → Roxo → Ciano
    card: 'linear-gradient(135deg, #1A1F2E, #242B3D)',         // Card gradient
  },

  // ===== EFEITOS NEON =====
  neon: {
    primary: '0 0 20px rgba(55, 115, 245, 0.4), 0 0 40px rgba(55, 115, 245, 0.2)',
    secondary: '0 0 20px rgba(138, 43, 226, 0.4), 0 0 40px rgba(138, 43, 226, 0.2)',
    accent: '0 0 20px rgba(0, 255, 221, 0.4), 0 0 40px rgba(0, 255, 221, 0.2)',
    success: '0 0 20px rgba(14, 203, 129, 0.4), 0 0 40px rgba(14, 203, 129, 0.2)',
    glow: '0 0 30px rgba(55, 115, 245, 0.3)',
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
