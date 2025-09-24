import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from './useTranslation';
import { AxiosError } from 'axios';

export interface ErrorDisplayOptions {
  showToast?: boolean;
  showModal?: boolean;
  logError?: boolean;
  customMessage?: string;
  onError?: (error: any) => void;
  retryAction?: () => void;
  contactSupportAction?: () => void;
}

export interface ErrorInfo {
  title: string;
  description: string;
  type: 'error' | 'warning' | 'info';
  icon?: string;
  actions?: {
    retry?: string;
    contactSupport?: string;
    dismiss?: string;
  };
  technicalDetails?: any;
}

export const useErrorDisplay = () => {
  const { t, isPortuguese } = useTranslation();

  const getErrorInfo = useCallback((error: any): ErrorInfo => {
    // Handle Axios errors
    if (error instanceof AxiosError) {
      const { response, request } = error;
      
      if (response) {
        const status = response.status;
        const data = response.data;
        
        switch (status) {
          case 400:
            return {
              title: t('errors.validation_error'),
              description: data?.message || t('errors.invalid_request'),
              type: 'warning',
              icon: 'AlertTriangle',
              actions: {
                retry: t('common.try_again'),
                dismiss: t('common.close')
              }
            };
            
          case 401:
            return {
              title: t('errors.authentication_error'),
              description: t('errors.session_expired'),
              type: 'error',
              icon: 'Lock',
              actions: {
                retry: t('navigation.login'),
                dismiss: t('common.close')
              }
            };
            
          case 403:
            return {
              title: t('errors.authorization_error'),
              description: t('errors.access_denied'),
              type: 'error',
              icon: 'Shield',
              actions: {
                contactSupport: t('errors.contact_support'),
                dismiss: t('common.close')
              }
            };
            
          case 404:
            return {
              title: t('errors.not_found'),
              description: t('errors.resource_not_found'),
              type: 'warning',
              icon: 'Search',
              actions: {
                retry: t('common.try_again'),
                dismiss: t('common.close')
              }
            };
            
          case 429:
            return {
              title: t('errors.rate_limit_exceeded'),
              description: t('errors.too_many_requests'),
              type: 'warning',
              icon: 'Clock',
              actions: {
                retry: t('common.try_again'),
                dismiss: t('common.close')
              }
            };
            
          case 500:
          case 502:
          case 503:
          case 504:
            return {
              title: t('errors.server_error'),
              description: t('errors.server_unavailable'),
              type: 'error',
              icon: 'Server',
              actions: {
                retry: t('common.try_again'),
                contactSupport: t('errors.contact_support'),
                dismiss: t('common.close')
              }
            };
            
          default:
            return {
              title: t('errors.unexpected_error'),
              description: data?.message || t('errors.something_went_wrong'),
              type: 'error',
              icon: 'AlertCircle',
              actions: {
                retry: t('common.try_again'),
                contactSupport: t('errors.contact_support'),
                dismiss: t('common.close')
              }
            };
        }
      } else if (request) {
        return {
          title: t('errors.network_error'),
          description: t('errors.connection_problem'),
          type: 'error',
          icon: 'Wifi',
          actions: {
            retry: t('common.try_again'),
            dismiss: t('common.close')
          }
        };
      }
    }
    
    // Handle generic errors
    if (error?.code) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return {
            title: t('errors.network_error'),
            description: t('errors.check_internet'),
            type: 'error',
            icon: 'Wifi',
            actions: {
              retry: t('common.try_again'),
              dismiss: t('common.close')
            }
          };
          
        case 'TIMEOUT':
          return {
            title: t('errors.timeout'),
            description: t('errors.request_timeout'),
            type: 'warning',
            icon: 'Clock',
            actions: {
              retry: t('common.try_again'),
              dismiss: t('common.close')
            }
          };
          
        case 'INVALID_CREDENTIALS':
          return {
            title: t('errors.invalid_credentials'),
            description: t('errors.check_credentials'),
            type: 'error',
            icon: 'Key',
            actions: {
              retry: t('common.try_again'),
              dismiss: t('common.close')
            }
          };
          
        case 'INSUFFICIENT_FUNDS':
          return {
            title: t('errors.insufficient_funds'),
            description: t('errors.add_funds'),
            type: 'warning',
            icon: 'DollarSign',
            actions: {
              retry: t('common.try_again'),
              dismiss: t('common.close')
            }
          };
          
        case 'RATE_LIMIT_EXCEEDED':
          return {
            title: t('errors.rate_limit_exceeded'),
            description: t('errors.wait_before_retry'),
            type: 'warning',
            icon: 'Clock',
            actions: {
              retry: t('common.try_again'),
              dismiss: t('common.close')
            }
          };
          
        case 'SERVICE_UNAVAILABLE':
          return {
            title: t('errors.service_unavailable'),
            description: t('errors.service_maintenance'),
            type: 'error',
            icon: 'Server',
            actions: {
              retry: t('common.try_again'),
              contactSupport: t('errors.contact_support'),
              dismiss: t('common.close')
            }
          };
          
        case 'MAINTENANCE_MODE':
          return {
            title: t('errors.maintenance_mode'),
            description: t('errors.system_maintenance'),
            type: 'info',
            icon: 'Settings',
            actions: {
              dismiss: t('common.close')
            }
          };
      }
    }
    
    // Default error
    return {
      title: t('errors.unexpected_error'),
      description: error?.message || t('errors.something_went_wrong'),
      type: 'error',
      icon: 'AlertCircle',
      actions: {
        retry: t('common.try_again'),
        contactSupport: t('errors.contact_support'),
        dismiss: t('common.close')
      }
    };
  }, [t]);

  const displayError = useCallback((
    error: any,
    options: ErrorDisplayOptions = {}
  ) => {
    const {
      showToast = true,
      showModal = false,
      logError = true,
      customMessage,
      onError,
      retryAction,
      contactSupportAction
    } = options;

    const errorInfo = getErrorInfo(error);
    
    // Log error if requested
    if (logError) {
      console.error('Error displayed:', {
        error,
        errorInfo,
        timestamp: new Date().toISOString()
      });
    }

    // Call custom error handler
    if (onError) {
      onError(error);
    }

    // Show toast notification
    if (showToast) {
      const message = customMessage || errorInfo.description;
      
      switch (errorInfo.type) {
        case 'error':
          toast.error(message, {
            duration: 5000,
            action: errorInfo.actions?.retry && retryAction ? {
              label: errorInfo.actions.retry,
              onClick: retryAction
            } : undefined
          });
          break;
        case 'warning':
          toast.warning(message, {
            duration: 4000,
            action: errorInfo.actions?.retry && retryAction ? {
              label: errorInfo.actions.retry,
              onClick: retryAction
            } : undefined
          });
          break;
        case 'info':
          toast.info(message, {
            duration: 3000
          });
          break;
      }
    }

    // Show modal if requested
    if (showModal) {
      // This would trigger a modal component
      // For now, we'll just log it
      console.log('Modal error display requested:', errorInfo);
    }

    return errorInfo;
  }, [getErrorInfo]);

  const displaySuccess = useCallback((message: string, options: { duration?: number } = {}) => {
    toast.success(message, {
      duration: options.duration || 3000
    });
  }, []);

  const displayWarning = useCallback((message: string, options: { duration?: number } = {}) => {
    toast.warning(message, {
      duration: options.duration || 4000
    });
  }, []);

  const displayInfo = useCallback((message: string, options: { duration?: number } = {}) => {
    toast.info(message, {
      duration: options.duration || 3000
    });
  }, []);

  return {
    displayError,
    displaySuccess,
    displayWarning,
    displayInfo,
    getErrorInfo
  };
};
