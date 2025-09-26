import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { RealtimeDataProvider } from '@/contexts/RealtimeDataContext';
import { PositionsProvider } from '@/contexts/PositionsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AccountProvider } from '@/contexts/AccountContext';
import { VersionProvider } from '@/contexts/VersionContext';
import UpdateNotification from '@/components/UpdateNotification';
import RouteRedirectMiddleware from '@/components/RouteRedirectMiddleware';
import { Layout } from '@/components/layout/Layout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDynamicFavicon } from '@/hooks/useDynamicFavicon';
import { useDynamicPageConfig } from '@/hooks/useDynamicPageConfig';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { SmartRedirect } from '@/components/guards/SmartRedirect';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Landing } from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import MarginGuard from '@/pages/MarginGuard';
import { Automation } from '@/pages/Automation';
import { Logs } from '@/pages/Logs';
import Reports from '@/pages/Reports';
import Positions from '@/pages/Positions';
import Backtests from '@/pages/Backtests';
import Trading from '@/pages/Trading';
import Simulation from '@/pages/Simulation';
import NotFound from './pages/NotFound';
import { useAuthStore } from '@/stores/auth';
import { useEffect } from 'react';
import AdminLayout from '@/pages/admin/Layout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminMenuManagement from '@/pages/admin/MenuManagement';
import DynamicPagesConfig from '@/pages/admin/DynamicPagesConfig';
import AdminMonitoring from '@/pages/admin/Monitoring';
import Monitoring from '@/pages/admin/Monitoring';
import Alerts from '@/pages/admin/Alerts';
import AdminUsers from '@/pages/admin/Users';
import AdminCoupons from '@/pages/admin/Coupons';
import AdminAlerts from '@/pages/admin/Alerts';
import AdminSettings from '@/pages/admin/Settings';
import AdminTooltips from '@/pages/admin/Tooltips';
import { Plans } from '@/pages/admin/Plans';
import TradingAnalytics from '@/pages/admin/TradingAnalytics';
import TradeLogs from '@/pages/admin/TradeLogs';
import PaymentAnalytics from '@/pages/admin/PaymentAnalytics';
import BacktestReports from '@/pages/admin/BacktestReports';
import SimulationAnalytics from '@/pages/admin/SimulationAnalytics';
import AutomationManagement from '@/pages/admin/AutomationManagement';
import NotificationManagement from '@/pages/admin/NotificationManagement';
import SystemReports from '@/pages/admin/SystemReports';
import AuditLogs from '@/pages/admin/AuditLogs';
import RouteRedirects from '@/pages/admin/RouteRedirects';
import TestPermissions from '@/pages/TestPermissions';
import DesignSystem from '@/pages/DesignSystem';
import Documentation from '@/pages/admin/Documentation';
import RateLimiting from '@/pages/admin/RateLimiting';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  console.log('🔍 PROTECTED ROUTE - State check:', {
    isAuthenticated,
    isLoading,
    isInitialized
  });

  // Se não foi inicializado ainda, mostrar loading
  if (!isInitialized) {
    console.log('⏳ PROTECTED ROUTE - Not initialized yet, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar para login
  if (!isAuthenticated) {
    console.log('❌ PROTECTED ROUTE - Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }

  console.log('✅ PROTECTED ROUTE - Access granted, rendering content');
  return <>{children}</>;
};

// Public Route Component (redirect authenticated users to appropriate page)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  // Se está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se está autenticado E tem dados do usuário, redirecionar para página apropriada
  if (isAuthenticated && user) {
    const redirectTo = user.is_admin ? '/admin' : '/dashboard';
    console.log('🔄 PUBLIC ROUTE - User is authenticated, redirecting to:', redirectTo, { is_admin: user.is_admin });
    return <Navigate to={redirectTo} replace />;
  }

  console.log('✅ PUBLIC ROUTE - User not authenticated, allowing access');
  return <>{children}</>;
};

// Admin Route Component (requires superadmin role)
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isInitialized, user } = useAuthStore();

  console.log('🔍 ADMIN ROUTE - State check:', {
    isAuthenticated,
    isLoading,
    isInitialized,
    user: user ? { id: user.id, email: user.email, is_admin: user.is_admin } : null
  });

  // Se não foi inicializado ainda, mostrar loading
  if (!isInitialized) {
    console.log('⏳ ADMIN ROUTE - Not initialized yet, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não está autenticado OU não tem usuário, redirecionar para login
  if (!isAuthenticated || !user) {
    console.log('❌ ADMIN ROUTE - Not authenticated or no user, redirecting to login');
    return <Navigate to="/login" />;
  }

  // Verificar se o usuário é admin
  if (!user.is_admin) {
    console.log('❌ ADMIN ROUTE - User is not admin, redirecting to dashboard');
    // Se não é admin, redirecionar para dashboard do usuário comum
    return <Navigate to="/dashboard" />;
  }

  console.log('✅ ADMIN ROUTE - Access granted, rendering admin content');
  return <>{children}</>;
};

// Componente interno para gerenciar título global (deve estar dentro do Router)
const GlobalPageTitle = () => {
  const pageConfig = useDynamicPageConfig();
  
  // Sempre chamar o hook, mas controlar a lógica internamente
  const { updateTitle } = usePageTitle({ baseTitle: 'defiSATS', showPL: true });
  
  useEffect(() => {
    if (!pageConfig.use_dynamic_title) {
      // Se não deve usar título dinâmico, definir título customizado
      if (pageConfig.custom_title) {
        document.title = pageConfig.custom_title;
      }
    }
    // Se deve usar título dinâmico, o hook usePageTitle já gerencia isso
  }, [pageConfig.use_dynamic_title, pageConfig.custom_title, updateTitle]);
  
  return null; // Este componente não renderiza nada, apenas gerencia o título
};

// Componente interno para gerenciar favicon dinâmico (deve estar dentro do Router)
const GlobalDynamicFavicon = () => {
  const pageConfig = useDynamicPageConfig();
  
  // Sempre chamar o hook, mas controlar a lógica internamente
  const { updateFavicon } = useDynamicFavicon();
  
  useEffect(() => {
    if (!pageConfig.use_dynamic_favicon) {
      // Se não deve usar favicon dinâmico, definir favicon customizado
      if (pageConfig.custom_favicon_url) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = pageConfig.custom_favicon_url;
        } else {
          const link = document.createElement('link');
          link.rel = 'icon';
          link.href = pageConfig.custom_favicon_url;
          document.head.appendChild(link);
        }
      }
    }
    // Se deve usar favicon dinâmico, o hook useDynamicFavicon já gerencia isso
  }, [pageConfig.use_dynamic_favicon, pageConfig.custom_favicon_url, updateFavicon]);
  
  return null; // Este componente não renderiza nada, apenas gerencia o favicon
};

const App = () => {
  const { getProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Try to get profile on app load
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('🔄 APP - Token found, calling getProfile...');
      // Don't call setLoading here - onRehydrateStorage already set it to true
      getProfile().catch((error) => {
        console.log('❌ APP - getProfile failed:', error);
        // Don't clear tokens automatically - let the user decide
        // The auth store will handle the error state
      });
    } else {
      console.log('❌ APP - No token found');
      setLoading(false);
    }
  }, [getProfile, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <VersionProvider autoCheck={true}>
          <RealtimeDataProvider>
            <PositionsProvider>
              <NotificationProvider>
                <AccountProvider>
                  <TooltipProvider>
              <Toaster />
              <Sonner />
              <UpdateNotification />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <RouteRedirectMiddleware>
                  <GlobalPageTitle />
                  <GlobalDynamicFavicon />
                  <Routes>
                  <Route path="/" element={
                    <PublicRoute>
                      <Landing />
                    </PublicRoute>
                  } />
                  <Route
              path="/login"
                element={
                  <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
                  <Route
              path="/register"
                element={
                  <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
                  <Route
              path="/dashboard"
                element={
                <ProtectedRoute>
                  <RouteGuard>
                    <ResponsiveLayout>
                      <Dashboard />
                    </ResponsiveLayout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
                  <Route
              path="/profile"
                element={
                <ProtectedRoute>
                  <RouteGuard>
                    <ResponsiveLayout>
                      <Profile />
                    </ResponsiveLayout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
                  <Route
              path="/margin-guard"
                element={
                <ProtectedRoute>
                  <RouteGuard requiredPlan="advanced">
                    <Layout>
                      <MarginGuard />
                    </Layout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulation"
              element={
                <ProtectedRoute>
                  <RouteGuard requiredPlan="advanced">
                    <Layout>
                      <Simulation />
                    </Layout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
                  <Route
              path="/automation"
                element={
                <ProtectedRoute>
                  <RouteGuard requiredPlan="basic">
                    <ResponsiveLayout>
                      <Automation />
                    </ResponsiveLayout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
                  <Route
              path="/reports"
                element={
                <ProtectedRoute>
                  <RouteGuard requiredPlan="basic">
                    <ResponsiveLayout>
                      <Reports />
                    </ResponsiveLayout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
                  <Route
              path="/positions"
                element={
                <ProtectedRoute>
                  <RouteGuard requiredPlan="basic">
                    <ResponsiveLayout>
                      <Positions />
                    </ResponsiveLayout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
                  <Route
              path="/backtests"
                element={
                <ProtectedRoute>
                  <RouteGuard requiredPlan="basic">
                    <ResponsiveLayout>
                      <Backtests />
                    </ResponsiveLayout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
                  <Route
              path="/logs"
                element={
                <ProtectedRoute>
                  <RouteGuard requiredPlan="advanced">
                    <Layout>
                      <Logs />
                    </Layout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
                  <Route
              path="/trading"
                element={
                <ProtectedRoute>
                  <RouteGuard requiredPlan="advanced">
                    <Layout>
                      <Trading />
                    </Layout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
                  <Route
              path="/test-permissions"
                element={
                <ProtectedRoute>
                  <TestPermissions />
                </ProtectedRoute>
              }
            />
                  <Route
              path="/design-system"
                element={
                <ProtectedRoute>
                  <RouteGuard>
                    <ResponsiveLayout>
                      <DesignSystem />
                    </ResponsiveLayout>
                  </RouteGuard>
                </ProtectedRoute>
              }
            />
            {/* Admin Routes */}
                  <Route
              path="/admin"
                element={
                <AdminRoute>
                  <RouteGuard requireAdmin>
                    <AdminLayout />
                  </RouteGuard>
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="trading-analytics" element={<TradingAnalytics />} />
              <Route path="trade-logs" element={<TradeLogs />} />
              <Route path="payment-analytics" element={<PaymentAnalytics />} />
              <Route path="backtest-reports" element={<BacktestReports />} />
              <Route path="simulation-analytics" element={<SimulationAnalytics />} />
              <Route path="automation-management" element={<AutomationManagement />} />
              <Route path="notification-management" element={<NotificationManagement />} />
              <Route path="system-reports" element={<SystemReports />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="route-redirects" element={<RouteRedirects />} />
              <Route path="menus" element={<AdminMenuManagement />} />
              <Route path="dynamic-pages" element={<DynamicPagesConfig />} />
              <Route path="tooltips" element={<AdminTooltips />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="rate-limiting" element={<RateLimiting />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="plans" element={<Plans />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="documentation" element={<Documentation />} />
            </Route>
                  <Route path="*" element={<NotFound />} />
          </Routes>
                </RouteRedirectMiddleware>
        </BrowserRouter>
                </TooltipProvider>
              </AccountProvider>
            </NotificationProvider>
          </PositionsProvider>
        </RealtimeDataProvider>
        </VersionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
