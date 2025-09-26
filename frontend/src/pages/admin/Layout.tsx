import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/auth';
import {
  LayoutDashboard,
  Monitor,
  Users,
  Gift,
  AlertTriangle,
  Settings,
  Menu as MenuIcon,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Palette,
  CreditCard,
  Info,
  Shield,
  Activity,
  Database,
  BarChart3,
  FileText,
  Cpu,
  Bot,
  BarChart2,
  Bell,
  ArrowRightLeft,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Trading Analytics', href: '/admin/trading-analytics', icon: BarChart3 },
  { name: 'Trade Logs', href: '/admin/trade-logs', icon: FileText },
  { name: 'Payment Analytics', href: '/admin/payment-analytics', icon: CreditCard },
  { name: 'Backtest Reports', href: '/admin/backtest-reports', icon: BarChart2 },
  { name: 'Simulation Analytics', href: '/admin/simulation-analytics', icon: Cpu },
  { name: 'Automation Management', href: '/admin/automation-management', icon: Bot },
  { name: 'Notification Management', href: '/admin/notification-management', icon: Bell },
  { name: 'System Reports', href: '/admin/system-reports', icon: FileText },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: Shield },
  { name: 'Route Redirects', href: '/admin/route-redirects', icon: ArrowRightLeft },
  { name: 'Plans', href: '/admin/plans', icon: CreditCard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Coupons', href: '/admin/coupons', icon: Gift },
  { name: 'Menus', href: '/admin/menus', icon: MenuIcon },
  { name: 'Dynamic Pages', href: '/admin/dynamic-pages', icon: Palette },
  { name: 'Tooltips', href: '/admin/tooltips', icon: Info },
  { name: 'Monitoring', href: '/admin/monitoring', icon: Monitor, badge: { text: 'done', color: 'green' } },
  { name: 'Alerts', href: '/admin/alerts', icon: AlertTriangle, badge: { text: 'done', color: 'green' } },
  { name: 'LN Markets Diagnostic', href: '/admin/lnmarkets-diagnostic', icon: Activity, badge: { text: 'new', color: 'blue' } },
  { name: 'Market Data Fallback', href: '/admin/market-data-fallback', icon: Shield, badge: { text: 'critical', color: 'red' } },
  { name: 'Rate Limiting', href: '/admin/rate-limiting', icon: Shield, badge: { text: 'done', color: 'green' } },
  { name: 'Documentation', href: '/admin/documentation', icon: BookOpen },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuthStore();

  // Configurar título e favicon estáticos para o admin
  useEffect(() => {
    // Definir título estático para admin
    document.title = 'Admin Panel - defiSATS';
    
    // Definir favicon estático para admin
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = '/favicon-admin.svg';
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon-admin.svg';
      document.head.appendChild(link);
    }

    // Cleanup function para restaurar quando sair do admin
    return () => {
      // Não restaurar automaticamente, deixar para o sistema principal gerenciar
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear localStorage manually
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div 
          className="fixed inset-0 bg-black bg-opacity-50" 
          onClick={() => setSidebarOpen(false)} 
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col h-full backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
          <div className="flex h-16 items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto min-h-0">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start profile-sidebar-item",
                    isActive ? "active text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "ml-2 text-xs",
                        item.badge.color === 'green' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      )}
                    >
                      {item.badge.text}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>
          <div 
            className="p-4 flex-shrink-0"
            style={{ borderTop: '1px solid hsl(var(--border))' }}
          >
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={toggleTheme}
              >
                {theme === 'light' ? (
                  <Moon className="mr-3 h-5 w-5" />
                ) : (
                  <Sun className="mr-3 h-5 w-5" />
                )}
                {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col h-full backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
          <div className="flex h-16 items-center px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto min-h-0">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start profile-sidebar-item",
                    isActive ? "active text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "ml-2 text-xs",
                        item.badge.color === 'green' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      )}
                    >
                      {item.badge.text}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>
          <div 
            className="p-4 flex-shrink-0"
            style={{ borderTop: '1px solid hsl(var(--border))' }}
          >
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={toggleTheme}
              >
                {theme === 'light' ? (
                  <Moon className="mr-3 h-5 w-5" />
                ) : (
                  <Sun className="mr-3 h-5 w-5" />
                )}
                {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 backdrop-blur-xl bg-card/30 border-border/50 profile-sidebar-glow">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Theme toggle */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Alternar para modo escuro' : 'Alternar para modo claro'}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
              
              {/* Status indicator */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-sm opacity-50"></div>
                  <div className="h-2 w-2 bg-green-500 rounded-full relative"></div>
                </div>
                <span className="text-sm text-text-secondary">
                  System Online
                </span>
              </div>
              
              {/* Admin badge */}
              <Badge className="backdrop-blur-sm bg-gradient-to-r from-primary/90 to-primary/80 text-white shadow-lg shadow-primary/25">
                <Shield className="mr-1 h-3 w-3" />
                Superadmin
              </Badge>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
