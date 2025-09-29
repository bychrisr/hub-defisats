import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationAPI } from '@/lib/api';

export interface RegistrationData {
  // Step 1: Personal Data
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  couponCode?: string;
  emailMarketingConsent?: boolean;
  termsConsent?: boolean;
  
  // Step 2: Plan Selection
  planId?: 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime';
  billingPeriod?: 'monthly' | 'quarterly' | 'yearly';
  
  // Step 3: Payment
  paymentMethod?: 'lightning' | 'lnmarkets';
  lightningAddress?: string;
  
  // Step 4: Credentials
  lnMarketsApiKey?: string;
  lnMarketsApiSecret?: string;
  lnMarketsPassphrase?: string;
}

export interface RegistrationProgress {
  currentStep: string;
  completedSteps: string[];
  personalData?: any;
  selectedPlan?: string;
  paymentData?: any;
  credentialsData?: any;
  couponCode?: string;
}

export interface RegistrationState {
  isLoading: boolean;
  error: string | null;
  sessionToken: string | null;
  progress: RegistrationProgress | null;
  currentStep: string;
}

export const useRegistration = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<RegistrationState>({
    isLoading: false,
    error: null,
    sessionToken: null,
    progress: null,
    currentStep: 'personal_data',
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Step 1: Save personal data
  const savePersonalData = useCallback(async (data: Partial<RegistrationData>) => {
    setLoading(true);
    clearError();

    try {
      console.log('📝 REGISTRATION - Saving personal data:', data.email);

      const response = await registrationAPI.savePersonalData({
        firstName: data.firstName!,
        lastName: data.lastName!,
        username: data.username!,
        email: data.email!,
        password: data.password!,
        confirmPassword: data.confirmPassword!,
        couponCode: data.couponCode,
      });

      console.log('✅ REGISTRATION - Personal data saved:', response.data);

      setState(prev => ({
        ...prev,
        sessionToken: response.data.sessionToken,
        currentStep: response.data.nextStep,
        progress: {
          currentStep: response.data.nextStep,
          completedSteps: ['personal_data'],
          personalData: data,
        },
      }));

      // Navigate to next step
      navigate('/register/plan', {
        state: {
          sessionToken: response.data.sessionToken,
          personalData: data,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ REGISTRATION - Personal data error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.message ||
                          'Failed to save personal data';
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [navigate, setLoading, clearError, setError]);

  // Step 2: Select plan
  const selectPlan = useCallback(async (data: Partial<RegistrationData>) => {
    setLoading(true);
    clearError();

    try {
      console.log('📋 REGISTRATION - Selecting plan:', data.planId);

      const response = await registrationAPI.selectPlan({
        planId: data.planId!,
        billingPeriod: data.billingPeriod!,
        sessionToken: state.sessionToken || undefined,
      });

      console.log('✅ REGISTRATION - Plan selected:', response.data);

      setState(prev => ({
        ...prev,
        currentStep: response.data.nextStep,
        progress: {
          ...prev.progress!,
          currentStep: response.data.nextStep,
          completedSteps: [...prev.progress!.completedSteps, 'plan_selection'],
          selectedPlan: data.planId,
        },
      }));

      // Navigate to next step
      if (response.data.nextStep === 'credentials') {
        // Skip payment for lifetime coupons
        navigate('/register/credentials', {
          state: {
            sessionToken: state.sessionToken,
            personalData: state.progress?.personalData,
            selectedPlan: data,
            couponData: response.data.couponData,
          },
        });
      } else {
        // Go to payment
        navigate('/register/plan/payment', {
          state: {
            sessionToken: state.sessionToken,
            personalData: state.progress?.personalData,
            selectedPlan: data,
            couponData: response.data.couponData,
          },
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ REGISTRATION - Plan selection error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.message ||
                          'Failed to select plan';
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.sessionToken, state.progress, navigate, setLoading, clearError, setError]);

  // Step 3: Process payment
  const processPayment = useCallback(async (data: Partial<RegistrationData>) => {
    setLoading(true);
    clearError();

    try {
      console.log('💳 REGISTRATION - Processing payment:', data.paymentMethod);

      const response = await registrationAPI.processPayment({
        paymentMethod: data.paymentMethod!,
        lightningAddress: data.lightningAddress,
        sessionToken: state.sessionToken || undefined,
      });

      console.log('✅ REGISTRATION - Payment processed:', response.data);

      setState(prev => ({
        ...prev,
        currentStep: response.data.nextStep,
        progress: {
          ...prev.progress!,
          currentStep: response.data.nextStep,
          completedSteps: [...prev.progress!.completedSteps, 'payment'],
          paymentData: data,
        },
      }));

      // Navigate to credentials
      navigate('/register/credentials', {
        state: {
          sessionToken: state.sessionToken,
          personalData: state.progress?.personalData,
          selectedPlan: state.progress?.selectedPlan,
          paymentData: data,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ REGISTRATION - Payment error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.message ||
                          'Failed to process payment';
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.sessionToken, state.progress, navigate, setLoading, clearError, setError]);

  // Step 4: Save credentials
  const saveCredentials = useCallback(async (data: Partial<RegistrationData>) => {
    setLoading(true);
    clearError();

    try {
      console.log('🔐 REGISTRATION - Saving credentials');

      const response = await registrationAPI.saveCredentials({
        lnMarketsApiKey: data.lnMarketsApiKey!,
        lnMarketsApiSecret: data.lnMarketsApiSecret!,
        lnMarketsPassphrase: data.lnMarketsPassphrase!,
        sessionToken: state.sessionToken || undefined,
      });

      console.log('✅ REGISTRATION - Credentials saved, registration completed:', response.data);

      setState(prev => ({
        ...prev,
        currentStep: 'completed',
        progress: {
          ...prev.progress!,
          currentStep: 'completed',
          completedSteps: [...prev.progress!.completedSteps, 'credentials'],
          credentialsData: data,
        },
      }));

      // Navigate to success page or login
      navigate('/login', {
        state: {
          message: 'Registration completed successfully! Please log in.',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ REGISTRATION - Credentials error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.message ||
                          'Failed to save credentials';
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.sessionToken, state.progress, navigate, setLoading, clearError, setError]);

  // Get registration progress
  const getProgress = useCallback(async (sessionToken?: string) => {
    setLoading(true);
    clearError();

    try {
      console.log('📊 REGISTRATION - Getting progress');

      const response = await registrationAPI.getProgress(sessionToken || state.sessionToken);

      console.log('✅ REGISTRATION - Progress retrieved:', response.data);

      setState(prev => ({
        ...prev,
        progress: response.data.progress,
        currentStep: response.data.progress.currentStep,
      }));

      return response.data.progress;
    } catch (error: any) {
      console.error('❌ REGISTRATION - Progress error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          'Failed to get registration progress';
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.sessionToken, setLoading, clearError, setError]);

  // Initialize registration with session token
  const initializeRegistration = useCallback((sessionToken: string, progress?: RegistrationProgress) => {
    setState(prev => ({
      ...prev,
      sessionToken,
      progress: progress || null,
      currentStep: progress?.currentStep || 'personal_data',
    }));
  }, []);

  // Reset registration state
  const resetRegistration = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      sessionToken: null,
      progress: null,
      currentStep: 'personal_data',
    });
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    sessionToken: state.sessionToken,
    progress: state.progress,
    currentStep: state.currentStep,

    // Actions
    savePersonalData,
    selectPlan,
    processPayment,
    saveCredentials,
    getProgress,
    initializeRegistration,
    resetRegistration,
    clearError,
  };
};
