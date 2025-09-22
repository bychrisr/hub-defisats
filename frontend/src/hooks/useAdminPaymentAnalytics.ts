import { useState, useEffect } from 'react';
import { useApiErrorHandler } from './useApiErrorHandler';

export interface PaymentAnalyticsItem {
  id: string;
  userId: string;
  username: string;
  email: string;
  amountSats: number;
  amount: number | null;
  status: string;
  paymentMethod: string | null;
  planType: string;
  description: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentAnalyticsMetrics {
  totalRevenue: number;
  totalTransactions: number;
  conversionRate: number;
  avgTransactionValue: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
}

export interface PaymentAnalyticsFilters {
  search?: string;
  status?: string;
  paymentMethod?: string;
  planType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'paidAt' | 'amount' | 'amountSats';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaymentAnalyticsState {
  data: PaymentAnalyticsItem[];
  metrics: PaymentAnalyticsMetrics | null;
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

export function useAdminPaymentAnalytics(filters: PaymentAnalyticsFilters = {}) {
  const [state, setState] = useState<PaymentAnalyticsState>({
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
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
      if (filters.planType) queryParams.append('planType', filters.planType);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/payments/analytics?${queryParams.toString()}`, {
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
  }, [filters.search, filters.status, filters.paymentMethod, filters.planType, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortOrder, filters.page, filters.limit]);

  const refresh = () => {
    fetchAnalytics();
  };

  return {
    ...state,
    refresh
  };
}

