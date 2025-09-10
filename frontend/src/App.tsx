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
import { Settings } from '@/pages/Settings';
import { Reports } from '@/pages/Reports';
import { Logs } from '@/pages/Logs';
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
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
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
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  // Verificar se o usuário é admin
  if (!user.is_admin) {
    // Se não é admin, redirecionar para dashboard do usuário comum
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const App = () => {
  const { getProfile } = useAuthStore();

  useEffect(() => {
    // Try to get profile on app load
    const token = localStorage.getItem('access_token');
    if (token) {
      getProfile().catch(() => {
        // If profile fetch fails, clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      });
    }
  }, [getProfile]);

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
              path="/settings/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
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
