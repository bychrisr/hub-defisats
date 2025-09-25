import { useState, useEffect } from 'react';
import { useApiErrorHandler } from './useApiErrorHandler';

export interface TradeLog {
  id: string;
  userId: string;
  username: string;
  automationId: string | null;
  tradeId: string;
  status: string;
  action: string | null;
  planType: string | null;
  pnl: number | null;
  amount: number | null;
  price: number | null;
  errorMessage: string | null;
  executedAt: string;
  createdAt: string;
}

export interface TradeLogsMetrics {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnL: number;
  avgPnL: number;
}

export interface TradeLogsFilters {
  search?: string;
  status?: string;
  action?: string;
  planType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'executedAt' | 'createdAt' | 'pnl' | 'amount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TradeLogsState {
  data: TradeLog[];
  metrics: TradeLogsMetrics | null;
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

export function useAdminTradeLogs(filters: TradeLogsFilters = {}) {
  const [state, setState] = useState<TradeLogsState>({
    data: [],
    metrics: null,
    pagination: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const { handleApiError } = useApiErrorHandler();

  const fetchLogs = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.planType) queryParams.append('planType', filters.planType);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/trades/logs?${queryParams.toString()}`, {
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
    fetchLogs();
  }, [filters.search, filters.status, filters.action, filters.planType, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortOrder, filters.page, filters.limit]);

  const refresh = () => {
    fetchLogs();
  };

  return {
    ...state,
    refresh
  };
}

