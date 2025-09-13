import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          )}
        >
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
