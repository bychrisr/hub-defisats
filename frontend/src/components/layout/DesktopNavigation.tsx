import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  User,
  LogOut,
  Globe,
  DollarSign,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMainMenu } from '@/hooks/useDynamicMenus';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { MAIN_NAVIGATION } from '@/constants/navigation';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { AccountSelector } from '@/components/account/AccountSelector';

// Fallback para quando a API não estiver disponível
const fallbackNavigation = MAIN_NAVIGATION;

export const DesktopNavigation = ({ isScrolled = false }: { isScrolled?: boolean }) => {
  const location = useLocation();
  const { theme } = useTheme();
  const { menuItems, isLoading, error } = useMainMenu();
  const { canAccessRoute } = useUserPermissions();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  // Usar dados dinâmicos ou fallback
  const rawNavigation = (isLoading || error || !menuItems || menuItems.length === 0) ? fallbackNavigation : menuItems;
  
  // Filtrar navegação baseada em permissões
  const navigation = rawNavigation.filter(item => {
    try {
      return canAccessRoute(item.href);
    } catch (error) {
      console.warn('Error checking route access:', error);
      return true; // Fallback para permitir acesso se houver erro
    }
  });

  return (
    <nav className={cn(
      'hidden md:flex items-center justify-center transition-all duration-300',
      isScrolled ? 'h-12' : 'h-16'
    )}>
      <div className={cn(
        'nav-container',
        isScrolled ? 'space-x-1' : 'space-x-2'
      )}>
        {navigation.length === 0 ? (
          <div className="text-red-500">No navigation items found</div>
        ) : (
          navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'nav-item',
                isScrolled ? 'text-xs h-10' : 'text-sm h-12',
                active
                  ? 'nav-item-active'
                  : theme === 'dark' 
                    ? 'text-text-secondary hover:text-primary'
                    : 'text-text-primary hover:text-primary'
              )}
            >
              <Icon className={cn(
                'nav-item-icon',
                isScrolled ? 'h-3 w-3' : 'h-4 w-4'
              )} />
              <span className="nav-item-text">{item.name}</span>
            </Link>
          );
        }))}
      </div>
    </nav>
  );
};

export const DesktopHeader = () => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [language, setLanguage] = useState('pt-BR');
  const [currency, setCurrency] = useState('SATS');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');

  // Detectar scroll para reduzir header e controlar visibilidade
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      
      // Detectar direção do scroll
      if (scrollTop > lastScrollY && scrollTop > 100) {
        // Scroll para baixo - esconder header
        setScrollDirection('down');
        setIsVisible(false);
      } else if (scrollTop < lastScrollY) {
        // Scroll para cima - mostrar header
        setScrollDirection('up');
        setIsVisible(true);
      }
      
      // Reduzir header quando há scroll
      setIsScrolled(scrollTop > 50);
      
      lastScrollY = scrollTop;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getUserInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    // TODO: Implementar mudança de idioma
    console.log('Language changed to:', value);
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    // TODO: Implementar mudança de moeda
    console.log('Currency changed to:', value);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <header className={cn(
      'w-full border-b transition-all duration-500 ease-in-out transform header-fade-in glassmorphism-header relative',
      isScrolled ? 'shadow-coingecko-md' : '',
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
      'pointer-events-auto'
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          'flex items-center justify-between transition-all duration-300 relative z-10',
          isScrolled ? 'h-12' : 'h-16'
        )}>
          {/* Logo */}
          <div className="flex items-center space-x-2 group cursor-pointer logo-container" onClick={() => navigate('/dashboard')}>
            <div className={cn(
              'bg-gradient-primary rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg',
              isScrolled ? 'w-6 h-6' : 'w-8 h-8'
            )}>
              <span className={cn(
                'text-white transition-all duration-300 group-hover:animate-pulse',
                isScrolled ? 'text-xs' : 'text-sm'
              )}>
                🤖
              </span>
            </div>
            <span className={cn(
              'font-heading transition-all duration-300 text-text-primary group-hover:text-primary',
              isScrolled ? 'text-lg' : 'text-xl'
            )}>
              Axisor Bot
            </span>
          </div>

          {/* Navigation - Centered */}
          <div className="flex-1 flex justify-center">
            <DesktopNavigation isScrolled={isScrolled} />
          </div>

          {/* Right side - User Profile */}
          <div className="ml-auto flex items-center space-x-4">
            {/* Account Selector */}
            <AccountSelector />

            {/* Notifications */}
            <NotificationDropdown isScrolled={isScrolled} />

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'relative rounded-full p-0 transition-all duration-300 group subtle-hover',
                    isScrolled ? 'h-6 w-6' : 'h-8 w-8'
                  )}
                >
                  <Avatar className={cn(
                    'transition-all duration-300',
                    isScrolled ? 'h-6 w-6' : 'h-8 w-8'
                  )}>
                    <AvatarFallback className={cn(
                      'font-medium transition-all duration-300 bg-primary text-primary-foreground',
                      isScrolled ? 'text-xs' : 'text-xs'
                    )}>
                      {user ? getUserInitials(user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online Status Indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background online-indicator" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className={cn(
                  "w-56 transition-all duration-300 relative overflow-visible",
                  theme === 'dark' 
                    ? 'dropdown-glassmorphism text-text-primary' 
                    : 'dropdown-glassmorphism-light text-text-primary'
                )}
                align="end"
                forceMount
              >
                <DropdownMenuLabel className={cn(
                  "font-normal transition-colors duration-200",
                  theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                )}>
                  <div className="flex flex-col space-y-1">
                    <p className={cn(
                      "text-sm font-medium leading-none transition-colors duration-200",
                      theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                    )}>
                      {user?.email || 'User'}
                    </p>
                    <p className={cn(
                      "text-xs leading-none transition-colors duration-200",
                      theme === 'dark' ? 'text-text-secondary' : 'text-text-secondary'
                    )}>
                      {user?.plan_type?.toUpperCase() || 'FREE'} Plan
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                    theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                  )}
                  asChild
                >
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                
                {/* Language Selection */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger 
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                      theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                    )}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Idioma</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent 
                    className={cn(
                      "w-48 transition-all duration-300 relative",
                      theme === 'dark' 
                        ? 'dropdown-glassmorphism text-text-primary' 
                        : 'dropdown-glassmorphism-light text-text-primary'
                    )}
                    sideOffset={4}
                  >
                    <DropdownMenuItem 
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                        theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                      )}
                      onClick={() => handleLanguageChange('pt-BR')}
                    >
                      <span>🇧🇷 Português (BR)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                        theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                      )}
                      onClick={() => handleLanguageChange('en-US')}
                    >
                      <span>🇺🇸 English (US)</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Currency Selection */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger 
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                      theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                    )}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Moeda</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent 
                    className={cn(
                      "w-48 transition-all duration-300 relative",
                      theme === 'dark' 
                        ? 'dropdown-glassmorphism text-text-primary' 
                        : 'dropdown-glassmorphism-light text-text-primary'
                    )}
                    sideOffset={4}
                  >
                    <DropdownMenuItem 
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                        theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                      )}
                      onClick={() => handleCurrencyChange('SATS')}
                    >
                      <span>₿ SATS</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                        theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                      )}
                      onClick={() => handleCurrencyChange('USD')}
                    >
                      <span>$ USD</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Theme Selection */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger 
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                      theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                    )}
                  >
                    {getThemeIcon()}
                    <span className="ml-2">Tema</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent 
                    className={cn(
                      "w-48 transition-all duration-300 relative",
                      theme === 'dark' 
                        ? 'dropdown-glassmorphism text-text-primary' 
                        : 'dropdown-glassmorphism-light text-text-primary'
                    )}
                    sideOffset={4}
                  >
                    <DropdownMenuItem 
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                        theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                      )}
                      onClick={() => handleThemeChange('light')}
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Claro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                        theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                      )}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Escuro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground transition-all duration-200 dropdown-item-glassmorphism",
                        theme === 'dark' ? 'text-text-primary' : 'text-text-primary'
                      )}
                      onClick={() => handleThemeChange('system')}
                    >
                      <Monitor className="mr-2 h-4 w-4" />
                      <span>Sistema</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  className={cn(
                    'text-red-600 hover:text-red-700 transition-all duration-200 dropdown-item-glassmorphism',
                    theme === 'dark' 
                      ? 'hover:bg-red-900/20' 
                      : 'hover:bg-red-50'
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
