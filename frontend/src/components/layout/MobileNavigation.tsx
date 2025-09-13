import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Settings, 
  BarChart3, 
  Shield, 
  Activity,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileDrawer } from './MobileDrawer';

const mobileNavigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Automations', href: '/automation', icon: Settings },
  { name: 'Positions', href: '/positions', icon: Activity },
  { name: 'Backtests', href: '/backtests', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: Shield },
];

export const MobileNavigation = () => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e6e8ec] md:hidden z-40">
        <div className="flex justify-around items-center h-15">
          {mobileNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 transition-colors duration-200',
                  active
                    ? 'text-[#3773f5]'
                    : 'text-[#62666f]'
                )}
              >
                <Icon className={cn('h-6 w-6 mb-1', active && 'text-[#3773f5]')} />
                <span className={cn(
                  'text-xs font-medium truncate',
                  active ? 'text-[#3773f5]' : 'text-[#62666f]'
                )}>
                  {item.name}
                </span>
                {active && (
                  <div className="w-6 h-0.5 bg-[#3773f5] mt-1 rounded-full" />
                )}
              </Link>
            );
          })}
          
          {/* Menu Button */}
          <Button
            variant="ghost"
            className={cn(
              'flex flex-col items-center justify-center p-0 h-auto text-[#62666f] hover:text-[#3773f5] transition-colors duration-200 min-w-0 flex-1',
              isDrawerOpen && 'text-[#3773f5]'
            )}
            onClick={() => setIsDrawerOpen(true)}
          >
            <Menu className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Menu</span>
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
