import { useState, useEffect } from 'react';
import { useApiErrorHandler } from './useApiErrorHandler';

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  totalTrades: number;
  systemUptime: number;
  uptimePercentage: number;
}

export interface AdminDashboardState {
  metrics: AdminDashboardMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useAdminDashboard() {
  const [state, setState] = useState<AdminDashboardState>({
    metrics: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const { handleApiError } = useApiErrorHandler();

  const fetchMetrics = async () => {
    try {
      console.log('🔄 ADMIN DASHBOARD - Starting fetchMetrics...');
      setState(prev => ({ ...prev, loading: true, error: null }));

      const token = localStorage.getItem('access_token');
      console.log('🔑 ADMIN DASHBOARD - Token exists:', !!token);

      const response = await fetch('/api/admin/dashboard/metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 ADMIN DASHBOARD - Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ ADMIN DASHBOARD - Data received:', data);

      setState(prev => ({
        ...prev,
        metrics: data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('❌ ADMIN DASHBOARD - Error:', error);
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const refresh = () => {
    fetchMetrics();
  };

  return {
    ...state,
    refresh
  };
}

