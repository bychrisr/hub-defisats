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
  const rawNavigation = isLoading || error ? fallbackNavigation : menuItems;
  
  // Filtrar navegação baseada em permissões
  const navigation = rawNavigation.filter(item => canAccessRoute(item.href));

  return (
    <nav className={cn(
      'hidden md:flex items-center justify-center space-x-8 transition-all duration-300',
      isScrolled ? 'h-12 space-x-6' : 'h-16 space-x-8'
    )}>
      {navigation.map((item) => {
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
                ? 'text-[#3773f5] border-b-2 border-[#3773f5]'
                : theme === 'dark' 
                  ? 'text-gray-300 hover:text-[#3773f5]'
                  : 'text-[#13161c] hover:text-[#3773f5]'
            )}
          >
            <Icon className={cn(
              'transition-all duration-300',
              isScrolled ? 'h-3 w-3' : 'h-4 w-4'
            )} />
            <span>{item.name}</span>
          </Link>
        );
      })}
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
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-[#e6e8ec]',
      isScrolled ? 'shadow-lg' : ''
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          'flex items-center transition-all duration-300',
          isScrolled ? 'h-12' : 'h-16'
        )}>
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className={cn(
              'bg-gradient-to-r from-[#3773f5] to-[#2c5aa0] rounded-lg flex items-center justify-center transition-all duration-300',
              isScrolled ? 'w-6 h-6' : 'w-8 h-8'
            )}>
              <span className={cn(
                'text-white font-bold transition-all duration-300',
                isScrolled ? 'text-xs' : 'text-sm'
              )}>HD</span>
            </div>
            <span className={cn(
              'font-bold transition-all duration-300',
              theme === 'dark' ? 'text-white' : 'text-[#13161c]',
              isScrolled ? 'text-lg' : 'text-xl'
            )}>
              defiSATS
            </span>
          </div>

          {/* Navigation - Perfectly Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <DesktopNavigation isScrolled={isScrolled} />
          </div>

          {/* Right side - User Profile */}
          <div className="ml-auto flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'transition-all duration-300',
                isScrolled ? 'h-7 w-7' : 'h-9 w-9',
                theme === 'dark'
                  ? 'text-gray-300 hover:text-[#3773f5] hover:bg-gray-800'
                  : 'text-[#13161c] hover:text-[#3773f5] hover:bg-gray-100'
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
                      'font-medium transition-all duration-300',
                      isScrolled ? 'text-xs' : 'text-xs',
                      theme === 'dark' 
                        ? 'bg-[#3773f5] text-white' 
                        : 'bg-[#3773f5] text-white'
                    )}>
                      {user ? getUserInitials(user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className={cn(
                  'w-56 transition-colors duration-200',
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                )}
                align="end"
                forceMount
              >
                <DropdownMenuLabel className={cn(
                  'font-normal transition-colors duration-200',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                )}>
                  <div className="flex flex-col space-y-1">
                    <p className={cn(
                      'text-sm font-medium leading-none transition-colors duration-200',
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {user?.email || 'User'}
                    </p>
                    <p className={cn(
                      'text-xs leading-none transition-colors duration-200',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      {user?.plan_type?.toUpperCase() || 'FREE'} Plan
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className={cn(
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                )} />
                <DropdownMenuItem 
                  className={cn(
                    'transition-colors duration-200',
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-900 hover:bg-gray-100'
                  )}
                  asChild
                >
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className={cn(
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                )} />
                
                {/* Language Selection */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={cn(
                    'transition-colors duration-200',
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-900 hover:bg-gray-100'
                  )}>
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Idioma</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className={cn(
                    'transition-colors duration-200',
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  )}>
                    <DropdownMenuItem 
                      className={cn(
                        'transition-colors duration-200',
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-900 hover:bg-gray-100'
                      )}
                      onClick={() => handleLanguageChange('pt-BR')}
                    >
                      <span>🇧🇷 Português (BR)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={cn(
                        'transition-colors duration-200',
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-900 hover:bg-gray-100'
                      )}
                      onClick={() => handleLanguageChange('en-US')}
                    >
                      <span>🇺🇸 English (US)</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Currency Selection */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={cn(
                    'transition-colors duration-200',
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-900 hover:bg-gray-100'
                  )}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Moeda</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className={cn(
                    'transition-colors duration-200',
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  )}>
                    <DropdownMenuItem 
                      className={cn(
                        'transition-colors duration-200',
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-900 hover:bg-gray-100'
                      )}
                      onClick={() => handleCurrencyChange('SATS')}
                    >
                      <span>₿ SATS</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={cn(
                        'transition-colors duration-200',
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-900 hover:bg-gray-100'
                      )}
                      onClick={() => handleCurrencyChange('USD')}
                    >
                      <span>$ USD</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Theme Selection */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={cn(
                    'transition-colors duration-200',
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-900 hover:bg-gray-100'
                  )}>
                    {getThemeIcon()}
                    <span className="ml-2">Tema</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className={cn(
                    'transition-colors duration-200',
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  )}>
                    <DropdownMenuItem 
                      className={cn(
                        'transition-colors duration-200',
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-900 hover:bg-gray-100'
                      )}
                      onClick={() => handleThemeChange('light')}
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Claro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={cn(
                        'transition-colors duration-200',
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-900 hover:bg-gray-100'
                      )}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Escuro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={cn(
                        'transition-colors duration-200',
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-900 hover:bg-gray-100'
                      )}
                      onClick={() => handleThemeChange('system')}
                    >
                      <Monitor className="mr-2 h-4 w-4" />
                      <span>Sistema</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className={cn(
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                )} />
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
