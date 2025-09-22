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
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/admin/dashboard/metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        metrics: data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));
    } catch (error) {
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

