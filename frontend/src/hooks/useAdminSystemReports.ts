import { useState, useEffect } from 'react';
import { useApiErrorHandler } from './useApiErrorHandler';

export interface SystemReport {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  filePath: string | null;
  fileSize: number | null;
  generatedAt: string | null;
  createdAt: string;
}

export interface SystemReportsMetrics {
  totalReports: number;
  completedReports: number;
  generatingReports: number;
  failedReports: number;
  scheduledReports: number;
  totalFileSize: number;
}

export interface SystemReportsFilters {
  search?: string;
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'generatedAt' | 'title' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SystemReportsState {
  data: SystemReport[];
  metrics: SystemReportsMetrics | null;
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

export function useAdminSystemReports(filters: SystemReportsFilters = {}) {
  const [state, setState] = useState<SystemReportsState>({
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
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/reports/system?${queryParams.toString()}`, {
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
  }, [filters.search, filters.type, filters.status, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortOrder, filters.page, filters.limit]);

  const refresh = () => {
    fetchReports();
  };

  return {
    ...state,
    refresh
  };
}

