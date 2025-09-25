import { useState, useEffect } from 'react';
import { useApiErrorHandler } from './useApiErrorHandler';

export interface SimulationAnalyticsItem {
  id: string;
  userId: string;
  username: string;
  name: string;
  simulationType: string | null;
  status: string;
  planType: string | null;
  progress: number | null;
  duration: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface SimulationAnalyticsMetrics {
  totalSimulations: number;
  completedSimulations: number;
  runningSimulations: number;
  failedSimulations: number;
  avgProgress: number;
}

export interface SimulationAnalyticsFilters {
  search?: string;
  simulationType?: string;
  status?: string;
  planType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'startedAt' | 'completedAt' | 'progress';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SimulationAnalyticsState {
  data: SimulationAnalyticsItem[];
  metrics: SimulationAnalyticsMetrics | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useAdminSimulationAnalytics(filters: SimulationAnalyticsFilters = {}) {
  const [state, setState] = useState<SimulationAnalyticsState>({
    data: [],
    metrics: null,
    pagination: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const { handleApiError } = useApiErrorHandler();

  const fetchAnalytics = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.simulationType) queryParams.append('simulationType', filters.simulationType);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.planType) queryParams.append('planType', filters.planType);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/simulations/analytics?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        data: data.data || [],
        metrics: data.metrics || null,
        pagination: data.pagination || null,
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
    fetchAnalytics();
  }, [filters.search, filters.simulationType, filters.status, filters.planType, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortOrder, filters.page, filters.limit]);

  const refresh = () => {
    fetchAnalytics();
  };

  return {
    ...state,
    refresh
  };
}

