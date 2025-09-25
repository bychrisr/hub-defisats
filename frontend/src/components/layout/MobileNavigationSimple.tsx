import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Home, 
  Settings, 
  BarChart3, 
  Activity,
  Shield
} from 'lucide-react';

// Navegação simplificada para mobile
const SIMPLE_NAVIGATION = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    mobileName: 'Home'
  },
  { 
    name: 'Automations', 
    href: '/automation', 
    icon: Settings,
    mobileName: 'Auto'
  },
  { 
    name: 'Positions', 
    href: '/positions', 
    icon: BarChart3,
    mobileName: 'Pos'
  },
  { 
    name: 'Backtests', 
    href: '/backtests', 
    icon: Activity,
    mobileName: 'Test'
  },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: Shield,
    mobileName: 'Rep'
  },
];

export const MobileNavigationSimple = () => {
  const location = useLocation();
  const { theme } = useTheme();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav 
        className="mobile-nav fixed bottom-0 left-0 right-0 md:hidden z-50"
        style={{
          backgroundColor: 'hsl(var(--bg-card))',
          borderTop: '1px solid hsl(var(--border))',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center h-15">
          {SIMPLE_NAVIGATION.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const displayName = item.mobileName || item.name;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 flex-1 transition-colors duration-200',
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-text-secondary hover:text-primary hover:bg-accent/50'
                )}
              >
                <Icon className={cn('w-5 h-5 mb-1', active && 'text-primary')} />
                <span className={cn(
                  'text-xs truncate',
                  active ? 'text-primary' : 'text-text-secondary'
                )}>
                  {displayName}
                </span>
                {active && (
                  <div 
                    className="w-6 h-0.5 mt-1 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile navigation */}
      <div className="h-15 md:hidden" />
    </>
  );
};
