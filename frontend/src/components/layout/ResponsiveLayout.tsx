import { DesktopHeader } from './DesktopNavigation';
import { MobileNavigation } from './MobileNavigation';
import LNMarketsHeader from './LNMarketsHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
  const { theme } = useTheme();

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-200',
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    )}>
      {/* Fixed Headers Container */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Market Header - Above navigation */}
        <LNMarketsHeader />

        {/* Desktop Header - Hidden on mobile */}
        <div className="hidden md:block">
          <DesktopHeader />
        </div>
      </div>

      {/* Main Content with proper spacing */}
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-32 md:pt-32">
          {children}
        </div>
      </main>

      {/* Mobile Navigation - Hidden on desktop */}
      <div className="md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
};
