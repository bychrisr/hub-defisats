import { DesktopHeader } from './DesktopNavigation';
import { MobileNavigation } from './MobileNavigation';
import LNMarketsHeader from './LNMarketsHeader';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Market Header - Above navigation */}
      <div className="hidden md:block">
        <LNMarketsHeader />
      </div>

      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden md:block">
        <DesktopHeader />
      </div>

      {/* Main Content */}
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
