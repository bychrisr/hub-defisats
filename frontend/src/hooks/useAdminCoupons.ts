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
      console.log('🔍 ADMIN COUPONS - Current filters:', filters);
      console.log('🔍 ADMIN COUPONS - Current state:', { loading: true, error: null });
      
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Debug: Check token before request
      const token = localStorage.getItem('access_token');
      console.log('🔑 ADMIN COUPONS - Token exists:', !!token);
      console.log('🔑 ADMIN COUPONS - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      
      // Debug: Check API base URL
      console.log('🌐 ADMIN COUPONS - API base URL:', api.defaults.baseURL);
      console.log('🌐 ADMIN COUPONS - Full URL will be:', `${api.defaults.baseURL}/api/admin/coupons`);

      const requestParams = {
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        plan_type: filters.plan_type !== 'all' ? filters.plan_type : undefined,
      };
      
      console.log('📤 ADMIN COUPONS - Request params:', requestParams);
      console.log('📤 ADMIN COUPONS - Making GET request to /api/admin/coupons...');

      const response = await api.get('/api/admin/coupons', {
        params: requestParams
      });

      console.log('✅ ADMIN COUPONS - Response received!');
      console.log('📊 ADMIN COUPONS - Response status:', response.status);
      console.log('📊 ADMIN COUPONS - Response headers:', response.headers);
      console.log('📊 ADMIN COUPONS - Response data:', response.data);
      console.log('📊 ADMIN COUPONS - Response data type:', typeof response.data);
      console.log('📊 ADMIN COUPONS - Response data keys:', response.data ? Object.keys(response.data) : 'null');

      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        console.error('❌ ADMIN COUPONS - Invalid response structure:', response.data);
        throw new Error('Invalid response structure from server');
      }

      const couponsData = response.data.data || response.data || [];
      console.log('🔍 ADMIN COUPONS - Extracted coupons data:', couponsData);
      console.log('🔍 ADMIN COUPONS - Coupons data type:', typeof couponsData);
      console.log('🔍 ADMIN COUPONS - Is coupons data array?', Array.isArray(couponsData));
      
      // Ensure couponsData is an array
      if (!Array.isArray(couponsData)) {
        console.warn('⚠️ ADMIN COUPONS - Expected array but got:', typeof couponsData, couponsData);
        throw new Error('Expected array of coupons from server');
      }

      console.log('✅ ADMIN COUPONS - Setting state with coupons:', couponsData.length, 'items');
      setState(prev => ({
        ...prev,
        coupons: couponsData,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));
      
      console.log('✅ ADMIN COUPONS - fetchCoupons completed successfully');
    } catch (error) {
      console.error('❌ ADMIN COUPONS - Error in fetchCoupons:', error);
      console.error('❌ ADMIN COUPONS - Error type:', typeof error);
      console.error('❌ ADMIN COUPONS - Error message:', error.message);
      console.error('❌ ADMIN COUPONS - Error stack:', error.stack);
      
      if (error.response) {
        console.error('❌ ADMIN COUPONS - Error response status:', error.response.status);
        console.error('❌ ADMIN COUPONS - Error response data:', error.response.data);
        console.error('❌ ADMIN COUPONS - Error response headers:', error.response.headers);
      }
      
      const errorMessage = handleApiError(error);
      console.log('🔍 ADMIN COUPONS - Handled error message:', errorMessage);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  const createCoupon = async (couponData: CreateCouponData): Promise<Coupon> => {
    try {
      console.log('🔄 ADMIN COUPONS - Starting createCoupon...');
      console.log('📤 ADMIN COUPONS - Coupon data to create:', couponData);
      console.log('📤 ADMIN COUPONS - Coupon data type:', typeof couponData);
      console.log('📤 ADMIN COUPONS - Coupon data keys:', Object.keys(couponData));
      
      // Debug: Check if we have a token
      const token = localStorage.getItem('access_token');
      console.log('🔑 ADMIN COUPONS - Token exists:', !!token);
      console.log('🔑 ADMIN COUPONS - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      
      // Debug: Check API base URL
      console.log('🌐 ADMIN COUPONS - API base URL:', api.defaults.baseURL);
      console.log('🌐 ADMIN COUPONS - Full URL will be:', `${api.defaults.baseURL}/api/admin/coupons`);
      
      // Debug: Check current state before request
      console.log('🔍 ADMIN COUPONS - Current state before create:', state);
      
      console.log('📤 ADMIN COUPONS - Making POST request to /api/admin/coupons...');
      console.log('📤 ADMIN COUPONS - Request payload:', JSON.stringify(couponData, null, 2));
      
      const response = await api.post('/api/admin/coupons', couponData);
      
      console.log('✅ ADMIN COUPONS - Create response received!');
      console.log('📊 ADMIN COUPONS - Response status:', response.status);
      console.log('📊 ADMIN COUPONS - Response headers:', response.headers);
      console.log('📊 ADMIN COUPONS - Response data:', response.data);
      console.log('📊 ADMIN COUPONS - Response data type:', typeof response.data);
      console.log('📊 ADMIN COUPONS - Response data keys:', response.data ? Object.keys(response.data) : 'null');
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        console.error('❌ ADMIN COUPONS - Invalid create response structure:', response.data);
        throw new Error('Invalid response structure from server');
      }
      
      const createdCoupon = response.data.data;
      console.log('🔍 ADMIN COUPONS - Created coupon:', createdCoupon);
      console.log('🔍 ADMIN COUPONS - Created coupon type:', typeof createdCoupon);
      
      if (!createdCoupon) {
        console.error('❌ ADMIN COUPONS - No coupon data in response:', response.data);
        throw new Error('No coupon data in response');
      }
      
      // Add the new coupon to the current list instead of refetching
      console.log('🔄 ADMIN COUPONS - Adding coupon to current list...');
      console.log('🔍 ADMIN COUPONS - Current coupons count:', state.coupons?.length || 0);
      
      setState(prev => {
        const newCoupons = [...(prev.coupons || []), createdCoupon];
        console.log('✅ ADMIN COUPONS - New coupons list:', newCoupons.length, 'items');
        console.log('✅ ADMIN COUPONS - New coupons:', newCoupons);
        
        return {
          ...prev,
          coupons: newCoupons,
          lastUpdated: new Date()
        };
      });
      
      console.log('✅ ADMIN COUPONS - createCoupon completed successfully');
      return createdCoupon;
    } catch (error) {
      console.error('❌ ADMIN COUPONS - Error in createCoupon:', error);
      console.error('❌ ADMIN COUPONS - Error type:', typeof error);
      console.error('❌ ADMIN COUPONS - Error message:', error.message);
      console.error('❌ ADMIN COUPONS - Error stack:', error.stack);
      
      if (error.response) {
        console.error('❌ ADMIN COUPONS - Error response status:', error.response.status);
        console.error('❌ ADMIN COUPONS - Error response data:', error.response.data);
        console.error('❌ ADMIN COUPONS - Error response headers:', error.response.headers);
      }
      
      if (error.request) {
        console.error('❌ ADMIN COUPONS - Error request:', error.request);
      }
      
      console.error('❌ ADMIN COUPONS - Full error object:', error);
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
