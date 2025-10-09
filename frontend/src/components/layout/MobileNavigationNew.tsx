import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Home, 
  BarChart3, 
  Settings, 
  FileText, 
  MoreHorizontal 
} from 'lucide-react';

// Configuração da navegação mobile com 5 itens
const MOBILE_NAVIGATION = [
  { 
    name: 'Home', 
    href: '/dashboard', 
    icon: Home,
    isHighlight: false
  },
  { 
    name: 'Positions', 
    href: '/positions', 
    icon: BarChart3,
    isHighlight: false
  },
  { 
    name: 'Automations', 
    href: '/automations', 
    icon: Settings,
    isHighlight: true // Botão com mais destaque
  },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: FileText,
    isHighlight: false
  },
  { 
    name: 'Menu', 
    href: '#', 
    icon: MoreHorizontal,
    isHighlight: false,
    isMenu: true // Para abrir sidebar
  },
] as const;

export const MobileNavigationNew = () => {
  const location = useLocation();
  const { theme } = useTheme();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    if (href === '#') return false; // Menu não tem estado ativo
    return location.pathname.startsWith(href);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implementar abertura do sidebar
    console.log('Abrir sidebar do menu');
  };

  return (
    <>
      {/* Mobile Bottom Navigation com estilo glow */}
      <nav 
        className="mobile-nav fixed bottom-0 left-0 right-0 md:hidden z-50"
        style={{
          background: 'linear-gradient(135deg, #1A1F2E 0%, #242B3D 100%)',
          borderTop: '1px solid hsl(var(--border))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 20px rgba(55, 115, 245, 0.15)'
        }}
      >
        <div className="flex justify-around items-center h-16 px-2">
          {MOBILE_NAVIGATION.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isMenu = item.isMenu;
            const isHighlight = item.isHighlight;

            return (
              <div key={item.name} className="flex-1 flex justify-center">
                {isMenu ? (
                  <button
                    onClick={handleMenuClick}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-1 min-w-0 w-full transition-all duration-300 rounded-lg group',
                      'text-muted-foreground hover:text-primary hover:bg-accent/20'
                    )}
                  >
                    <div className="relative">
                      <Icon className="w-6 h-6 mb-1 transition-all duration-300 group-hover:scale-110" />
                      {isHighlight && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-medium truncate">
                      {item.name}
                    </span>
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-1 min-w-0 w-full transition-all duration-300 rounded-lg group relative',
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-primary hover:bg-accent/20'
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn(
                        'w-6 h-6 mb-1 transition-all duration-300',
                        active && 'scale-110',
                        isHighlight && 'drop-shadow-lg'
                      )} />
                      
                      {/* Efeito glow para o botão de Automations */}
                      {isHighlight && (
                        <div className={cn(
                          'absolute inset-0 rounded-full transition-all duration-300',
                          active 
                            ? 'bg-primary/20 shadow-lg shadow-primary/30' 
                            : 'group-hover:bg-primary/10 group-hover:shadow-lg group-hover:shadow-primary/20'
                        )} />
                      )}
                      
                      {/* Indicador de destaque para Automations */}
                      {isHighlight && !active && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </div>
                    
                    <span className={cn(
                      'text-xs font-medium truncate transition-all duration-300',
                      active && 'text-primary',
                      isHighlight && 'font-semibold'
                    )}>
                      {item.name}
                    </span>
                    
                    {/* Indicador de estado ativo */}
                    {active && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full shadow-lg shadow-primary/50" />
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile navigation */}
      <div className="h-16 md:hidden" />
    </>
  );
};
