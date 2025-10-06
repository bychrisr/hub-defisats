import { 
  Home, 
  Settings, 
  BarChart3, 
  Shield, 
  Activity,
  Coins,
  TrendingUp,
  Image,
  Info,
  Package,
  Code,
  Candy,
  Star,
  User
} from 'lucide-react';

// Ícones padronizados para navegação principal
export const NAVIGATION_ICONS = {
  HOME: Home,
  AUTOMATIONS: Settings,
  POSITIONS: BarChart3,
  BACKTESTS: Activity,
  REPORTS: Shield,
} as const;

// Ícones padronizados para navegação secundária
export const SECONDARY_NAVIGATION_ICONS = {
  CRYPTOCURRENCIES: Coins,
  EXCHANGES: TrendingUp,
  NFT: Image,
  INFORMATION: Info,
  PRODUCTS: Package,
  API: Code,
} as const;

// Ícones padronizados para navegação do usuário
export const USER_NAVIGATION_ICONS = {
  CANDIES: Candy,
  WALLET: Star,
  ACCOUNT: User,
} as const;

// Configuração de navegação principal (usada em mobile e desktop)
export const MAIN_NAVIGATION = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: NAVIGATION_ICONS.HOME,
    mobileName: 'Home' // Nome mais curto para mobile
  },
  { 
    name: 'Automations', 
    href: '/automations', 
    icon: NAVIGATION_ICONS.AUTOMATIONS 
  },
  { 
    name: 'Positions', 
    href: '/positions', 
    icon: NAVIGATION_ICONS.POSITIONS 
  },
  { 
    name: 'Backtests', 
    href: '/backtests', 
    icon: NAVIGATION_ICONS.BACKTESTS 
  },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: NAVIGATION_ICONS.REPORTS 
  },
] as const;

// Configuração de navegação secundária (usada no drawer)
export const SECONDARY_NAVIGATION = [
  { 
    name: 'Criptomoedas', 
    href: '/cryptocurrencies', 
    icon: SECONDARY_NAVIGATION_ICONS.CRYPTOCURRENCIES 
  },
  { 
    name: 'Câmbios', 
    href: '/exchanges', 
    icon: SECONDARY_NAVIGATION_ICONS.EXCHANGES 
  },
  { 
    name: 'NFT', 
    href: '/nft', 
    icon: SECONDARY_NAVIGATION_ICONS.NFT 
  },
  { 
    name: 'Informação', 
    href: '/information', 
    icon: SECONDARY_NAVIGATION_ICONS.INFORMATION 
  },
  { 
    name: 'Produtos', 
    href: '/products', 
    icon: SECONDARY_NAVIGATION_ICONS.PRODUCTS 
  },
  { 
    name: 'API', 
    href: '/api', 
    icon: SECONDARY_NAVIGATION_ICONS.API 
  },
] as const;

// Configuração de navegação do usuário (usada no drawer)
export const USER_NAVIGATION = [
  { 
    name: 'Os meus Candies', 
    href: '/candies', 
    icon: USER_NAVIGATION_ICONS.CANDIES, 
    color: 'text-purple-600' 
  },
  { 
    name: 'A minha carteira', 
    href: '/wallet', 
    icon: USER_NAVIGATION_ICONS.WALLET, 
    color: 'text-yellow-600' 
  },
  { 
    name: 'A minha conta', 
    href: '/account', 
    icon: USER_NAVIGATION_ICONS.ACCOUNT, 
    color: 'text-gray-600' 
  },
] as const;

// Tipografia padronizada para mobile
export const MOBILE_TYPOGRAPHY = {
  // Tamanhos de fonte
  textXs: 'text-xs',           // 12px - Labels pequenos
  textSm: 'text-sm',           // 14px - Texto secundário
  textBase: 'text-base',       // 16px - Texto principal
  textLg: 'text-lg',           // 18px - Títulos pequenos
  textXl: 'text-xl',           // 20px - Títulos médios
  text2Xl: 'text-2xl',         // 24px - Títulos grandes
  
  // Pesos de fonte
  fontNormal: 'font-normal',   // 400
  fontMedium: 'font-medium',   // 500
  fontSemibold: 'font-semibold', // 600
  fontBold: 'font-bold',       // 700
  
  // Altura da linha
  leadingTight: 'leading-tight',   // 1.25
  leadingNormal: 'leading-normal', // 1.5
  leadingRelaxed: 'leading-relaxed', // 1.625
  
  // Espaçamento entre letras
  trackingTight: 'tracking-tight',   // -0.025em
  trackingNormal: 'tracking-normal', // 0em
  trackingWide: 'tracking-wide',     // 0.025em
} as const;

// Classes de tipografia específicas para mobile
export const MOBILE_TEXT_CLASSES = {
  // Navegação mobile
  navLabel: `${MOBILE_TYPOGRAPHY.textXs} ${MOBILE_TYPOGRAPHY.fontMedium} ${MOBILE_TYPOGRAPHY.leadingTight}`,
  navIcon: 'h-6 w-6',
  
  // Drawer mobile
  drawerTitle: `${MOBILE_TYPOGRAPHY.textLg} ${MOBILE_TYPOGRAPHY.fontSemibold} ${MOBILE_TYPOGRAPHY.leadingTight}`,
  drawerItem: `${MOBILE_TYPOGRAPHY.textBase} ${MOBILE_TYPOGRAPHY.fontMedium} ${MOBILE_TYPOGRAPHY.leadingNormal}`,
  drawerSubItem: `${MOBILE_TYPOGRAPHY.textSm} ${MOBILE_TYPOGRAPHY.fontNormal} ${MOBILE_TYPOGRAPHY.leadingNormal}`,
  drawerIcon: 'h-5 w-5',
  
  // Botões mobile
  buttonText: `${MOBILE_TYPOGRAPHY.textSm} ${MOBILE_TYPOGRAPHY.fontMedium} ${MOBILE_TYPOGRAPHY.leadingNormal}`,
} as const;

