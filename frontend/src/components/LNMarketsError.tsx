import React from 'react';
import { AlertTriangle, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '../hooks/useTranslation';

interface LNMarketsErrorProps {
  error: string;
  onConfigure?: () => void;
  showConfigureButton?: boolean;
}

export function LNMarketsError({ 
  error, 
  onConfigure, 
  showConfigureButton = true 
}: LNMarketsErrorProps) {
  const { t } = useTranslation();
  
  const getErrorInfo = (error: string) => {
    if (error.includes('MISSING_CREDENTIALS') || error.includes('credentials not configured')) {
      return {
        title: t('errors.ln_markets_credentials'),
        description: t('errors.ln_markets_configure_description'),
        action: t('settings.configure'),
        icon: Settings,
        variant: 'default' as const
      };
    }
    
    if (error.includes('INVALID_CREDENTIALS') || error.includes('Invalid API credentials')) {
      return {
        title: t('errors.ln_markets_invalid'),
        description: t('errors.ln_markets_invalid_description'),
        action: t('errors.check_credentials'),
        icon: AlertTriangle,
        variant: 'destructive' as const
      };
    }
    
    if (error.includes('INSUFFICIENT_PERMISSIONS')) {
      return {
        title: t('errors.ln_markets_permissions'),
        description: t('errors.ln_markets_permissions_description'),
        action: t('errors.check_permissions'),
        icon: AlertTriangle,
        variant: 'destructive' as const
      };
    }
    
    if (error.includes('RATE_LIMIT') || error.includes('rate limit')) {
      return {
        title: t('errors.ln_markets_rate_limit'),
        description: t('errors.ln_markets_rate_limit_description'),
        action: t('common.try_again'),
        icon: AlertTriangle,
        variant: 'destructive' as const
      };
    }
    
    // Erro genérico
    return {
      title: t('errors.ln_markets_error'),
      description: t('errors.ln_markets_generic_description'),
      action: t('common.try_again'),
      icon: AlertTriangle,
      variant: 'destructive' as const
    };
  };

  const errorInfo = getErrorInfo(error);
  const Icon = errorInfo.icon;

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="space-y-3">
        <div>
          <h4 className="font-semibold text-orange-800 dark:text-orange-200">
            {errorInfo.title}
          </h4>
          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
            {errorInfo.description}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {showConfigureButton && onConfigure && (
            <Button
              onClick={onConfigure}
              variant={errorInfo.variant}
              size="sm"
              className="w-fit"
            >
              <Settings className="h-4 w-4 mr-2" />
              {errorInfo.action}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => window.open('https://docs.lnmarkets.com/api', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Documentação LN Markets
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
