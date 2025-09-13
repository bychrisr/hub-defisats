import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  X,
  ChevronRight,
  Coins,
  TrendingUp,
  Image,
  Info,
  Package,
  Code,
  Candy,
  Star,
  User,
  Settings,
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

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavigation = [
  { name: 'Criptomoedas', href: '/cryptocurrencies', icon: Coins },
  { name: 'Câmbios', href: '/exchanges', icon: TrendingUp },
  { name: 'NFT', href: '/nft', icon: Image },
  { name: 'Informação', href: '/information', icon: Info },
  { name: 'Produtos', href: '/products', icon: Package },
  { name: 'API', href: '/api', icon: Code },
];

const userNavigation = [
  { name: 'Os meus Candies', href: '/candies', icon: Candy, color: 'text-purple-600' },
  { name: 'A minha carteira', href: '/wallet', icon: Star, color: 'text-yellow-600' },
  { name: 'A minha conta', href: '/account', icon: User, color: 'text-gray-600' },
];

export const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [language, setLanguage] = useState('PT-BR');
  const [currency, setCurrency] = useState('USD');
  const [theme, setTheme] = useState('light');

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 md:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HD</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">defiSATS</span>
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
                          'w-full justify-between p-3 h-auto text-left font-medium text-gray-900 hover:bg-gray-50',
                          isActive(item.href) && 'bg-blue-50 text-blue-600'
                        )}
                        onClick={() => toggleSection(item.name)}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
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
                      <div className="text-sm text-gray-600 py-2">
                        Submenu para {item.name}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </nav>

            {/* Separator */}
            <div className="border-t border-gray-200 mx-4" />

            {/* User Navigation */}
            <nav className="p-4 space-y-1">
              {userNavigation.map((item) => {
                const Icon = item.icon;
                
                return (
                  <Collapsible key={item.name}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-between p-3 h-auto text-left font-medium text-gray-900 hover:bg-gray-50',
                          isActive(item.href) && 'bg-blue-50 text-blue-600'
                        )}
                        onClick={() => toggleSection(item.name)}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={cn('h-5 w-5', item.color)} />
                          <span>{item.name}</span>
                        </div>
                        <ChevronRight 
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            expandedSections.includes(item.name) && 'rotate-90'
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 ml-8">
                      <div className="text-sm text-gray-600 py-2">
                        Submenu para {item.name}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </nav>
          </div>

          {/* Settings Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              {/* Language Button */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50"
                onClick={() => setLanguage(language === 'PT-BR' ? 'EN-US' : 'PT-BR')}
              >
                <Globe className="h-4 w-4 mr-2" />
                {language}
              </Button>

              {/* Currency Button */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50"
                onClick={() => setCurrency(currency === 'USD' ? 'SATS' : 'USD')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {currency}
              </Button>

              {/* Theme Button */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  setTheme(theme === 'light' ? 'dark' : 'light');
                  // Aqui você pode integrar com o sistema de tema existente
                }}
              >
                {theme === 'light' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
