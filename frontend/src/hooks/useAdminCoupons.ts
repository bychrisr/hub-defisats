import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';

export interface Coupon {
  id: string;
  code: string;
  plan_type: 'basic' | 'advanced' | 'pro' | 'lifetime';
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  value_type: 'fixed' | 'percentage';
  value_amount: number;
  time_type: 'fixed' | 'lifetime';
  time_days: number | null;
  is_active: boolean;
  description: string | null;
  created_by: string | null;
  total_revenue_saved: number;
  new_users_count: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
  usage_history: Array<{
    used_at: string;
    user_email: string;
  }>;
}

export interface CreateCouponData {
  code: string;
  plan_type: 'basic' | 'advanced' | 'pro' | 'lifetime';
  value_type: 'fixed' | 'percentage';
  value_amount: number;
  time_type: 'fixed' | 'lifetime';
  time_days?: number;
  usage_limit: number;
  description?: string;
  is_active: boolean;
}

export interface CouponFilters {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'expired';
  plan_type: 'all' | 'basic' | 'advanced' | 'pro' | 'lifetime';
}

export interface AdminCouponsState {
  coupons: Coupon[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useAdminCoupons(filters: CouponFilters = { search: '', status: 'all', plan_type: 'all' }) {
  const [state, setState] = useState<AdminCouponsState>({
    coupons: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const { handleApiError } = useApiErrorHandler();

  const fetchCoupons = async () => {
    try {
      console.log('🔄 ADMIN COUPONS - Starting fetchCoupons...');
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await api.get('/api/admin/coupons', {
        params: {
          search: filters.search || undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          plan_type: filters.plan_type !== 'all' ? filters.plan_type : undefined,
        }
      });

      console.log('✅ ADMIN COUPONS - Data received:', response.data);

      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response structure from server');
      }

      const couponsData = response.data.data || response.data || [];
      
      // Ensure couponsData is an array
      if (!Array.isArray(couponsData)) {
        console.warn('⚠️ ADMIN COUPONS - Expected array but got:', typeof couponsData, couponsData);
        throw new Error('Expected array of coupons from server');
      }

      setState(prev => ({
        ...prev,
        coupons: couponsData,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('❌ ADMIN COUPONS - Error:', error);
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  const createCoupon = async (couponData: CreateCouponData): Promise<Coupon> => {
    try {
      console.log('🔄 ADMIN COUPONS - Creating coupon:', couponData);
      
      // Debug: Check if we have a token
      const token = localStorage.getItem('access_token');
      console.log('🔑 ADMIN COUPONS - Token exists:', !!token);
      console.log('🔑 ADMIN COUPONS - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      
      const response = await api.post('/api/admin/coupons', couponData);
      
      console.log('✅ ADMIN COUPONS - Coupon created:', response.data);
      
      // Refresh the list
      await fetchCoupons();
      
      return response.data.data;
    } catch (error) {
      console.error('❌ ADMIN COUPONS - Error creating coupon:', error);
      throw error;
    }
  };

  const updateCoupon = async (id: string, couponData: Partial<CreateCouponData>): Promise<Coupon> => {
    try {
      console.log('🔄 ADMIN COUPONS - Updating coupon:', id, couponData);
      
      const response = await api.put(`/api/admin/coupons/${id}`, couponData);
      
      console.log('✅ ADMIN COUPONS - Coupon updated:', response.data);
      
      // Refresh the list
      await fetchCoupons();
      
      return response.data.data;
    } catch (error) {
      console.error('❌ ADMIN COUPONS - Error updating coupon:', error);
      throw error;
    }
  };

  const deleteCoupon = async (id: string): Promise<void> => {
    try {
      console.log('🔄 ADMIN COUPONS - Deleting coupon:', id);
      
      await api.delete(`/api/admin/coupons/${id}`);
      
      console.log('✅ ADMIN COUPONS - Coupon deleted');
      
      // Refresh the list
      await fetchCoupons();
    } catch (error) {
      console.error('❌ ADMIN COUPONS - Error deleting coupon:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [filters.search, filters.status, filters.plan_type]);

  const refresh = () => {
    fetchCoupons();
  };

  return {
    ...state,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    refresh
  };
}
