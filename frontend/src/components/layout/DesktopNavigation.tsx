import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  User,
  Bell,
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
      'hidden md:flex items-center justify-center space-x-8 transition-all duration-300',
      isScrolled ? 'h-12 space-x-6' : 'h-16 space-x-8'
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
              'flex items-center justify-center space-x-2 font-medium uppercase tracking-wide transition-all duration-300 px-2',
              isScrolled ? 'text-xs h-12' : 'text-sm h-16',
              active
                ? 'text-[#3773F5] border-b-2 border-[#3773F5]'
                : theme === 'dark' 
                  ? 'text-[#B8BCC8] hover:text-[#3773F5]'
                  : 'text-[#0B0F1A] hover:text-[#3773F5]'
            )}
          >
            <Icon className={cn(
              'transition-all duration-300',
              isScrolled ? 'h-3 w-3' : 'h-4 w-4'
            )} />
            <span>{item.name}</span>
          </Link>
        );
      }))}
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

  // Detectar scroll para reduzir header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      // Inverter a lógica: quando não há scroll, header expandido; quando há scroll, header reduzido
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
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
      'w-full border-b transition-all duration-300',
      theme === 'dark' 
        ? 'bg-bg-primary border-border' 
        : 'bg-background border-border',
      isScrolled ? 'shadow-coingecko-md' : ''
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          'flex items-center justify-between transition-all duration-300',
          isScrolled ? 'h-12' : 'h-16'
        )}>
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className={cn(
              'bg-gradient-primary rounded-lg flex items-center justify-center transition-all duration-300',
              isScrolled ? 'w-6 h-6' : 'w-8 h-8'
            )}>
              <span className={cn(
                'font-bold text-white',
                isScrolled ? 'text-xs' : 'text-sm'
              )}>
                AX
              </span>
            </div>
            <span className={cn(
              'font-heading transition-all duration-300 text-text-primary',
              isScrolled ? 'text-lg' : 'text-xl'
            )}>
              Axisor
            </span>
          </div>

          {/* Navigation - Centered */}
          <div className="flex-1 flex justify-center">
            <DesktopNavigation isScrolled={isScrolled} />
          </div>

          {/* Right side - User Profile */}
          <div className="ml-auto flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'transition-all duration-300 text-text-secondary hover:text-primary hover:bg-accent',
                isScrolled ? 'h-7 w-7' : 'h-9 w-9'
              )}
            >
              <Bell className={cn(
                'transition-all duration-300',
                isScrolled ? 'h-3 w-3' : 'h-4 w-4'
              )} />
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'relative rounded-full p-0 transition-all duration-300',
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
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-popover border-border transition-colors duration-200"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal text-popover-foreground transition-colors duration-200">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-popover-foreground transition-colors duration-200">
                      {user?.email || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground transition-colors duration-200">
                      {user?.plan_type?.toUpperCase() || 'FREE'} Plan
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
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
                  <DropdownMenuSubTrigger className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200">
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Idioma</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-popover border-border transition-colors duration-200">
                    <DropdownMenuItem 
                      className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => handleLanguageChange('pt-BR')}
                    >
                      <span>🇧🇷 Português (BR)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => handleLanguageChange('en-US')}
                    >
                      <span>🇺🇸 English (US)</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Currency Selection */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200">
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Moeda</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-popover border-border transition-colors duration-200">
                    <DropdownMenuItem 
                      className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => handleCurrencyChange('SATS')}
                    >
                      <span>₿ SATS</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => handleCurrencyChange('USD')}
                    >
                      <span>$ USD</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Theme Selection */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200">
                    {getThemeIcon()}
                    <span className="ml-2">Tema</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-popover border-border transition-colors duration-200">
                    <DropdownMenuItem 
                      className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => handleThemeChange('light')}
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Claro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => handleThemeChange('dark')}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Escuro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
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
                    'text-red-600 hover:text-red-700 transition-colors duration-200',
                    theme === 'dark' 
                      ? 'hover:bg-gray-700' 
                      : 'hover:bg-gray-100'
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
