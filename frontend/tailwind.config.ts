import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Core CoinGecko Colors
        'coingecko-blue': '#3773f5',
        'coingecko-orange': '#f5ac37',
        'coingecko-green': '#0ecb81',
        'coingecko-red': '#f6465d',
        
        // Light Mode Colors
        'coingecko-bg': '#ffffff',
        'coingecko-text-primary': '#13161c',
        'coingecko-text-secondary': '#62666f',
        'coingecko-border': '#e6e8ec',
        'coingecko-header': '#f6f7f8',
        'coingecko-card': '#f9fafb',
        
        // Dark Mode Colors
        'coingecko-dark-bg': '#0d0f13',
        'coingecko-dark-card': '#16191d',
        'coingecko-dark-card-alt': '#1a1d22',
        'coingecko-dark-text-primary': '#eaecef',
        'coingecko-dark-text-secondary': '#848e9c',
        'coingecko-dark-border': '#21262d',
        'coingecko-dark-header': '#16191d',

        // CSS Variables (existing system)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          light: 'hsl(var(--primary-light))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          hover: 'hsl(var(--secondary-hover))',
          light: 'hsl(var(--secondary-light))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          hover: 'hsl(var(--success-hover))',
          light: 'hsl(var(--success-light))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          hover: 'hsl(var(--destructive-hover))',
          light: 'hsl(var(--destructive-light))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          hover: 'hsl(var(--warning-hover))',
          light: 'hsl(var(--warning-light))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Text colors
        'text-primary': 'hsl(var(--text-primary))',
        'text-secondary': 'hsl(var(--text-secondary))',
        // Background colors
        'bg-primary': 'hsl(var(--bg-primary))',
        'bg-card': 'hsl(var(--bg-card))',
        'bg-card-alt': 'hsl(var(--bg-card-alt))',
        'bg-header': 'hsl(var(--bg-header))',
        // Border colors
        'border-light': 'hsl(var(--border-light))',
        // Icon colors - Vibrantes
        'icon-primary': 'hsl(var(--icon-primary))',
        'icon-secondary': 'hsl(var(--icon-secondary))',
        'icon-success': 'hsl(var(--icon-success))',
        'icon-warning': 'hsl(var(--icon-warning))',
        'icon-danger': 'hsl(var(--icon-danger))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-in': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        'coingecko-sm': '0 1px 2px 0 rgba(55, 115, 245, 0.05)',
        'coingecko-md': '0 4px 6px -1px rgba(55, 115, 245, 0.1)',
        'coingecko-lg': '0 10px 15px -3px rgba(55, 115, 245, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [import('tailwindcss-animate')],
} satisfies Config;