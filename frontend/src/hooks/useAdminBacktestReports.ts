import { useState, useEffect } from 'react';
import { useApiErrorHandler } from './useApiErrorHandler';

export interface BacktestReport {
  id: string;
  userId: string;
  username: string;
  strategy: string | null;
  status: string;
  planType: string | null;
  executionTime: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface BacktestReportsMetrics {
  totalReports: number;
  completedReports: number;
  runningReports: number;
  failedReports: number;
  avgExecutionTime: number;
}

export interface BacktestReportsFilters {
  search?: string;
  status?: string;
  strategy?: string;
  planType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'completedAt' | 'executionTime';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface BacktestReportsState {
  data: BacktestReport[];
  metrics: BacktestReportsMetrics | null;
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

export function useAdminBacktestReports(filters: BacktestReportsFilters = {}) {
  const [state, setState] = useState<BacktestReportsState>({
    data: [],
    metrics: null,
    pagination: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const { handleApiError } = useApiErrorHandler();

  const fetchReports = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.strategy) queryParams.append('strategy', filters.strategy);
      if (filters.planType) queryParams.append('planType', filters.planType);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/backtests/reports?${queryParams.toString()}`, {
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
    fetchReports();
  }, [filters.search, filters.status, filters.strategy, filters.planType, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortOrder, filters.page, filters.limit]);

  const refresh = () => {
    fetchReports();
  };

  return {
    ...state,
    refresh
  };
}

