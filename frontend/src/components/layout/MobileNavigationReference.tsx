import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  Bot, 
  FileText, 
  MoreHorizontal 
} from 'lucide-react';
import { MobileDrawer } from './MobileDrawer';

const MOBILE_NAV_ITEMS = [
  { name: 'Home', href: '/dashboard', icon: Home, position: 'left' },
  { name: 'Positions', href: '/positions', icon: BarChart3, position: 'left-center' },
  { name: 'Automations', href: '/automations', icon: Bot, position: 'center', isHighlight: true },
  { name: 'Reports', href: '/reports', icon: FileText, position: 'right-center' },
  { name: 'Menu', href: '#', icon: MoreHorizontal, position: 'right', isMenu: true }
];

export const MobileNavigationReference = () => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    if (href === '#') return false;
    return location.pathname.startsWith(href);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDrawerOpen(true);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50">
        {/* SVG com curva central integrada */}
        <svg
          viewBox="0 0 360 70"
          className="w-full h-16"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="navGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1A1F2E" />
              <stop offset="100%" stopColor="#1A1F2E" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path
            d={`
              M0 0 
              L${360 / 2 - 60} 0 
              C${360 / 2 - 30} 0, ${360 / 2 - 30} ${70}, ${360 / 2} ${70} 
              C${360 / 2 + 30} ${70}, ${360 / 2 + 30} 0, ${360 / 2 + 60} 0 
              L360 0 
              L360 70 
              L0 70 
              Z
            `}
            fill="url(#navGradient)"
          />
        </svg>

        {/* Container dos botões */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between h-16 px-6 bg-[#1A1F2E]">
          {MOBILE_NAV_ITEMS.map(({ name, href, icon: Icon, isHighlight, isMenu }, index) => {
            const active = isActive(href);
            const isCenter = isHighlight;

            if (isMenu) {
              return (
                <button
                  key={name}
                  onClick={handleMenuClick}
                  className="flex flex-col items-center justify-center text-xs text-white/80 hover:text-white hover:scale-105 transition-transform duration-200"
                  aria-label="Open menu"
                >
                  <Icon size={20} />
                  <span>{name}</span>
                </button>
              );
            }

            // Botão central destacado
            if (isCenter) {
              return (
                <Link
                  key={name}
                  to={href}
                  className={`relative flex flex-col items-center justify-center text-xs font-semibold hover:scale-110 transition-transform duration-200 ${active ? 'text-purple-500' : 'text-white'}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className="absolute -top-12 w-24 h-24 bg-[#1A1F2E] rounded-full flex items-center justify-center shadow-lg scale-110 z-20 p-3">
                    <Icon 
                      size={38} 
                      className="icon-gradient"
                    />
                  </div>
                  <span className="mt-4">{name}</span>
                </Link>
              );
            }

            return (
              <Link
                key={name}
                to={href}
                className={`
                  flex flex-col items-center justify-center text-xs
                  ${active ? 'text-purple-500 font-semibold' : 'text-white/80'}
                  hover:text-white hover:scale-105 transition-transform duration-200
                `}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} />
                <span>{name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Drawer do menu */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Spacer for mobile navigation */}
      <div className="h-16 md:hidden bg-[#1A1F2E]" />
    </>
  );
};
