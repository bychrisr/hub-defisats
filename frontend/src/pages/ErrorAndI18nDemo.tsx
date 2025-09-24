import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { LanguageSelector } from '../components/LanguageSelector';
import { LNMarketsError } from '../components/LNMarketsError';
import { RateLimitError } from '../components/RateLimitError';
import { useErrorDisplay } from '../hooks/useErrorDisplay';
import { useTranslation } from '../hooks/useTranslation';
import { AxiosError } from 'axios';
import { Globe, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';

export default function ErrorAndI18nDemo() {
  const { t, getCurrentLanguage, isPortuguese, isEnglish } = useTranslation();
  const { displayError, displaySuccess, displayWarning, displayInfo } = useErrorDisplay();
  const [selectedError, setSelectedError] = useState<any>(null);

  const simulateErrors = {
    network: new AxiosError('Network Error', 'NETWORK_ERROR'),
    auth: new AxiosError('Unauthorized', '401', undefined, undefined, {
      status: 401,
      data: { message: 'Session expired' }
    }),
    validation: new AxiosError('Bad Request', '400', undefined, undefined, {
      status: 400,
      data: { message: 'Invalid input data' }
    }),
    rateLimit: new AxiosError('Too Many Requests', '429', undefined, undefined, {
      status: 429,
      data: { 
        message: 'Rate limit exceeded',
        retry_after: 60,
        limit: 100,
        remaining: 0,
        type: 'api'
      }
    }),
    server: new AxiosError('Internal Server Error', '500', undefined, undefined, {
      status: 500,
      data: { message: 'Server temporarily unavailable' }
    }),
    lnMarkets: 'MISSING_CREDENTIALS',
    generic: new Error('Something went wrong')
  };

  const handleErrorTest = (errorType: keyof typeof simulateErrors) => {
    const error = simulateErrors[errorType];
    setSelectedError(error);
    displayError(error);
  };

  const handleSuccessTest = () => {
    displaySuccess(t('success.saved'));
  };

  const handleWarningTest = () => {
    displayWarning(t('errors.timeout'));
  };

  const handleInfoTest = () => {
    displayInfo(t('common.loading'));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Globe className="h-8 w-8 text-primary" />
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          {t('common.error_display_and_i18n')}
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('common.error_display_description')}
        </p>

        <div className="flex items-center justify-center gap-4 mt-6">
          <Badge variant="secondary" className="px-3 py-1">
            <Globe className="h-3 w-3 mr-1" />
            {getCurrentLanguage() === 'pt-BR' ? 'Português' : 'English'}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {t('common.error_handling')}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <Zap className="h-3 w-3 mr-1" />
            {t('common.real_time')}
          </Badge>
        </div>
      </div>

      {/* Language Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>{t('settings.language')}</span>
          </CardTitle>
          <CardDescription>
            {t('settings.language_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSelector variant="card" />
        </CardContent>
      </Card>

      {/* Error Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{t('common.error_testing')}</span>
          </CardTitle>
          <CardDescription>
            {t('common.error_testing_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleErrorTest('network')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{t('errors.network_error')}</span>
            </Button>
            
            <Button
              onClick={() => handleErrorTest('auth')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{t('errors.authentication_error')}</span>
            </Button>
            
            <Button
              onClick={() => handleErrorTest('validation')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{t('errors.validation_error')}</span>
            </Button>
            
            <Button
              onClick={() => handleErrorTest('rateLimit')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{t('errors.rate_limit_exceeded')}</span>
            </Button>
            
            <Button
              onClick={() => handleErrorTest('server')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{t('errors.server_error')}</span>
            </Button>
            
            <Button
              onClick={() => handleErrorTest('lnMarkets')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{t('errors.ln_markets_error')}</span>
            </Button>
          </div>

          {/* Success/Warning/Info Tests */}
          <div className="flex space-x-4 pt-4 border-t">
            <Button
              onClick={handleSuccessTest}
              variant="outline"
              className="flex items-center space-x-2 text-green-600"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{t('common.success_test')}</span>
            </Button>
            
            <Button
              onClick={handleWarningTest}
              variant="outline"
              className="flex items-center space-x-2 text-yellow-600"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{t('common.warning_test')}</span>
            </Button>
            
            <Button
              onClick={handleInfoTest}
              variant="outline"
              className="flex items-center space-x-2 text-blue-600"
            >
              <Info className="h-4 w-4" />
              <span>{t('common.info_test')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display Components */}
      {selectedError && (
        <Card>
          <CardHeader>
            <CardTitle>{t('common.error_display_component')}</CardTitle>
            <CardDescription>
              {t('common.error_display_component_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Universal Error Display */}
              <div>
                <h4 className="font-medium mb-3">{t('common.universal_error_display')}</h4>
                <ErrorDisplay
                  error={selectedError}
                  onRetry={() => console.log('Retry clicked')}
                  onContactSupport={() => console.log('Contact support clicked')}
                  onDismiss={() => setSelectedError(null)}
                  showTechnicalDetails={true}
                />
              </div>

              {/* LN Markets Error */}
              {typeof selectedError === 'string' && (
                <div>
                  <h4 className="font-medium mb-3">{t('common.ln_markets_error_display')}</h4>
                  <LNMarketsError
                    error={selectedError}
                    onConfigure={() => console.log('Configure clicked')}
                  />
                </div>
              )}

              {/* Rate Limit Error */}
              {selectedError?.response?.status === 429 && (
                <div>
                  <h4 className="font-medium mb-3">{t('common.rate_limit_error_display')}</h4>
                  <RateLimitError
                    retryAfter={selectedError.response.data.retry_after || 60}
                    limit={selectedError.response.data.limit || 100}
                    remaining={selectedError.response.data.remaining || 0}
                    type={selectedError.response.data.type || 'general'}
                    onRetry={() => console.log('Rate limit retry clicked')}
                    onContactSupport={() => console.log('Rate limit contact support clicked')}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.features_overview')}</CardTitle>
          <CardDescription>
            {t('common.features_overview_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">{t('common.error_handling_features')}</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• {t('common.universal_error_display')}</li>
                <li>• {t('common.internationalized_messages')}</li>
                <li>• {t('common.contextual_actions')}</li>
                <li>• {t('common.technical_details')}</li>
                <li>• {t('common.retry_mechanisms')}</li>
                <li>• {t('common.support_integration')}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">{t('common.i18n_features')}</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• {t('common.pt_br_support')}</li>
                <li>• {t('common.en_us_support')}</li>
                <li>• {t('common.language_switching')}</li>
                <li>• {t('common.persistent_preferences')}</li>
                <li>• {t('common.automatic_detection')}</li>
                <li>• {t('common.fallback_support')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
