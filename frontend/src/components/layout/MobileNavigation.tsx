import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileDrawer } from './MobileDrawer';
import { useTheme } from '@/contexts/ThemeContext';
import { useMainMenu } from '@/hooks/useDynamicMenus';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { MAIN_NAVIGATION, MOBILE_TEXT_CLASSES } from '@/constants/navigation';

// Fallback para quando a API não estiver disponível
const fallbackNavigation = MAIN_NAVIGATION;

export const MobileNavigation = () => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    <>
      {/* Mobile Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 md:hidden z-40"
        style={{
          backgroundColor: 'hsl(var(--bg-card))',
          borderTop: '1px solid hsl(var(--border))'
        }}
      >
        <div className="flex justify-around items-center h-15">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const displayName = item.mobileName || item.name;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 transition-colors duration-200',
                  active
                    ? 'text-primary'
                    : 'text-text-secondary'
                )}
              >
                <Icon className={cn(MOBILE_TEXT_CLASSES.navIcon, 'mb-1', active && 'text-primary')} />
                <span className={cn(
                  MOBILE_TEXT_CLASSES.navLabel,
                  'truncate',
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
          
          {/* Menu Button */}
          <Button
            variant="ghost"
            className={cn(
              'flex flex-col items-center justify-center p-0 h-auto transition-colors duration-200 min-w-0 flex-1',
              isDrawerOpen ? 'text-primary' : 'text-text-secondary hover:text-primary'
            )}
            onClick={() => setIsDrawerOpen(true)}
          >
            <Menu className={cn(MOBILE_TEXT_CLASSES.navIcon, 'mb-1')} />
            <span className={MOBILE_TEXT_CLASSES.navLabel}>Menu</span>
          </Button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

      {/* Spacer for mobile navigation */}
      <div className="h-15 md:hidden" />
    </>
  );
};
