import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Landing } from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import MarginGuard from '@/pages/MarginGuard';
import { Automation } from '@/pages/Automation';
import { Logs } from '@/pages/Logs';
import Reports from '@/pages/Reports';
import Trades from '@/pages/Trades';
import NotFound from './pages/NotFound';
import { useAuthStore } from '@/stores/auth';
import { useEffect } from 'react';
import AdminLayout from '@/pages/admin/Layout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminMonitoring from '@/pages/admin/Monitoring';
import AdminUsers from '@/pages/admin/Users';
import AdminCoupons from '@/pages/admin/Coupons';
import AdminAlerts from '@/pages/admin/Alerts';
import AdminSettings from '@/pages/admin/Settings';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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

// Public Route Component (allow access even if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Landing />} />
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
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/margin-guard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MarginGuard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/automation"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Automation />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Logs />
                  </Layout>
                </ProtectedRoute>
              }
            />
          <Route
            path="/trades"
            element={
              <ProtectedRoute>
                <Layout>
                  <Trades />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="monitoring" element={<AdminMonitoring />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="alerts" element={<AdminAlerts />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
