import React from 'react';
import { AlertTriangle, AlertCircle, Clock, Wifi, Lock, Shield, Search, Server, Key, DollarSign, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useTranslation } from '../hooks/useTranslation';
import { ErrorInfo } from '../hooks/useErrorDisplay';

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onContactSupport?: () => void;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
  className?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  onContactSupport,
  onDismiss,
  showTechnicalDetails = false,
  className = ''
}: ErrorDisplayProps) {
  const { t } = useTranslation();

  const getErrorInfo = (error: any): ErrorInfo => {
    // Handle Axios errors
    if (error?.response) {
      const status = error.response.status;
      const data = error.response.data;
      
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
    }
    
    // Handle network errors
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
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
    }
    
    // Handle timeout errors
    if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
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
    }
    
    // Handle LN Markets specific errors
    if (error?.message?.includes('LN Markets') || error?.message?.includes('ln_markets')) {
      if (error.message.includes('credentials')) {
        return {
          title: t('errors.ln_markets_credentials'),
          description: t('errors.check_credentials'),
          type: 'warning',
          icon: 'Key',
          actions: {
            retry: t('common.try_again'),
            dismiss: t('common.close')
          }
        };
      }
      
      return {
        title: t('errors.ln_markets_error'),
        description: error.message,
        type: 'error',
        icon: 'AlertTriangle',
        actions: {
          retry: t('common.try_again'),
          contactSupport: t('errors.contact_support'),
          dismiss: t('common.close')
        }
      };
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
  };

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      AlertTriangle,
      AlertCircle,
      Clock,
      Wifi,
      Lock,
      Shield,
      Search,
      Server,
      Key,
      DollarSign,
      Settings
    };
    
    const IconComponent = iconMap[iconName] || AlertCircle;
    return <IconComponent className="h-6 w-6" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'error':
        return <Badge variant="destructive">{t('common.error')}</Badge>;
      case 'warning':
        return <Badge variant="secondary">{t('common.warning')}</Badge>;
      case 'info':
        return <Badge variant="outline">{t('common.info')}</Badge>;
      default:
        return <Badge variant="outline">{t('common.error')}</Badge>;
    }
  };

  const errorInfo = getErrorInfo(error);

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${getTypeColor(errorInfo.type)}`}>
          {getIcon(errorInfo.icon || 'AlertCircle')}
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <CardTitle className="text-lg font-semibold">
            {errorInfo.title}
          </CardTitle>
          {getTypeBadge(errorInfo.type)}
        </div>
        <CardDescription className="text-sm">
          {errorInfo.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex flex-col space-y-2">
          {errorInfo.actions?.retry && onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="w-full"
            >
              {errorInfo.actions.retry}
            </Button>
          )}
          
          {errorInfo.actions?.contactSupport && onContactSupport && (
            <Button 
              onClick={onContactSupport}
              variant="ghost"
              className="w-full text-sm"
            >
              {errorInfo.actions.contactSupport}
            </Button>
          )}
          
          {errorInfo.actions?.dismiss && onDismiss && (
            <Button 
              onClick={onDismiss}
              variant="ghost"
              className="w-full text-sm"
            >
              {errorInfo.actions.dismiss}
            </Button>
          )}
        </div>

        {/* Technical Details */}
        {showTechnicalDetails && (
          <details className="text-xs text-gray-500 dark:text-gray-400">
            <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              {t('common.technical_details')}
            </summary>
            <div className="mt-2 space-y-1 font-mono">
              <div><strong>Type:</strong> {errorInfo.type}</div>
              <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
              {error?.response?.status && (
                <div><strong>Status:</strong> {error.response.status}</div>
              )}
              {error?.response?.data && (
                <div><strong>Response:</strong> {JSON.stringify(error.response.data, null, 2)}</div>
              )}
              {error?.message && (
                <div><strong>Message:</strong> {error.message}</div>
              )}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
