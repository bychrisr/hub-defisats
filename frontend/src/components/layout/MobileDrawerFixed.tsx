import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  X,
  ChevronRight,
  Globe,
  DollarSign,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useTheme } from '@/contexts/ThemeContext';
import { useSecondaryMenu, useUserMenu } from '@/hooks/useDynamicMenus';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { 
  SECONDARY_NAVIGATION, 
  USER_NAVIGATION, 
  MOBILE_TEXT_CLASSES 
} from '@/constants/navigation';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Fallback para quando a API não estiver disponível
const fallbackSecondaryNavigation = SECONDARY_NAVIGATION;
const fallbackUserNavigation = USER_NAVIGATION;

export const MobileDrawerFixed = ({ isOpen, onClose }: MobileDrawerProps) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [language, setLanguage] = useState('PT-BR');
  const [currency, setCurrency] = useState('USD');
  const { theme, toggleTheme } = useTheme();
  
  // Hooks para dados dinâmicos
  const { menuItems: secondaryMenuItems, isLoading: secondaryLoading, error: secondaryError } = useSecondaryMenu();
  const { menuItems: userMenuItems, isLoading: userLoading, error: userError } = useUserMenu();
  const { canAccessRoute } = useUserPermissions();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  // Usar dados dinâmicos ou fallback
  const rawMainNavigation = secondaryLoading || secondaryError ? fallbackSecondaryNavigation : secondaryMenuItems;
  const rawUserNavigation = userLoading || userError ? fallbackUserNavigation : userMenuItems;
  
  // Filtrar navegação baseada em permissões
  const mainNavigation = rawMainNavigation.filter(item => canAccessRoute(item.href));
  const userNavigation = rawUserNavigation.filter(item => canAccessRoute(item.href));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="mobile-drawer-backdrop fixed inset-0 bg-black/50 z-[60] md:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className="mobile-drawer fixed inset-y-0 left-0 w-80 z-[60] md:hidden transform transition-transform duration-300 ease-in-out"
        style={{ backgroundColor: 'hsl(var(--bg-card))' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4"
            style={{ borderBottom: '1px solid hsl(var(--border))' }}
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HD</span>
              </div>
              <span 
                className={MOBILE_TEXT_CLASSES.drawerTitle}
                style={{ color: 'hsl(var(--text-primary))' }}
              >
                defiSATS
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const isExpanded = expandedSections.includes(item.name);
                
                return (
                  <Collapsible key={item.name}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-between p-3 h-auto text-left font-medium transition-colors',
                          isActive(item.href) && 'bg-primary/10 text-primary'
                        )}
                        style={{
                          color: isActive(item.href) ? 'hsl(var(--primary))' : 'hsl(var(--text-primary))',
                          backgroundColor: isActive(item.href) ? 'hsl(var(--primary) / 0.1)' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive(item.href)) {
                            e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(item.href)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                        onClick={() => toggleSection(item.name)}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={MOBILE_TEXT_CLASSES.drawerIcon} />
                          <span className={MOBILE_TEXT_CLASSES.drawerItem}>{item.name}</span>
                        </div>
                        <ChevronRight 
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            isExpanded && 'rotate-90'
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 ml-8">
                      <div 
                        className={cn(MOBILE_TEXT_CLASSES.drawerSubItem, 'py-2')}
                        style={{ color: 'hsl(var(--text-secondary))' }}
                      >
                        Submenu para {item.name}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </nav>

            {/* User Navigation */}
            <div className="p-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
              <nav className="space-y-1">
                {userNavigation.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center space-x-3 p-3 rounded-lg transition-colors',
                        isActive(item.href) 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-text-primary hover:bg-accent'
                      )}
                      onClick={onClose}
                    >
                      <Icon className={MOBILE_TEXT_CLASSES.drawerIcon} />
                      <span className={MOBILE_TEXT_CLASSES.drawerItem}>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div 
            className="p-4 border-t"
            style={{ borderColor: 'hsl(var(--border))' }}
          >
            <div className="space-y-3">
              {/* Language Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" style={{ color: 'hsl(var(--text-secondary))' }} />
                  <span className={MOBILE_TEXT_CLASSES.drawerItem}>Idioma</span>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent border rounded px-2 py-1 text-sm"
                  style={{ 
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--text-primary))'
                  }}
                >
                  <option value="PT-BR">PT-BR</option>
                  <option value="EN-US">EN-US</option>
                </select>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" style={{ color: 'hsl(var(--text-secondary))' }} />
                  <span className={MOBILE_TEXT_CLASSES.drawerItem}>Moeda</span>
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent border rounded px-2 py-1 text-sm"
                  style={{ 
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--text-primary))'
                  }}
                >
                  <option value="USD">USD</option>
                  <option value="BRL">BRL</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto"
                onClick={toggleTheme}
              >
                <div className="flex items-center space-x-3">
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  <span className={MOBILE_TEXT_CLASSES.drawerItem}>
                    {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
