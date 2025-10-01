import React from 'react';
import { useLNMarketsCredentials } from '@/hooks/useLNMarketsCredentials';
import { LNMarketsError } from '@/components/LNMarketsError';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LNMarketsGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showConfigureButton?: boolean;
}

export function LNMarketsGuard({ 
  children, 
  fallback,
  showConfigureButton = true 
}: LNMarketsGuardProps) {
  const { hasCredentials, isLoading, needsConfiguration } = useLNMarketsCredentials();
  const navigate = useNavigate();

  // ✅ DEBUG: Verificar se o guard está sendo ativado incorretamente
  console.log('🔍 LN MARKETS GUARD DEBUG:', {
    hasCredentials,
    isLoading,
    needsConfiguration,
    showConfigureButton
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Checking LN Markets credentials...</span>
        </div>
      </div>
    );
  }

  if (needsConfiguration) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <LNMarketsError 
            error="MISSING_CREDENTIALS"
            onConfigure={() => navigate('/profile')}
            showConfigureButton={showConfigureButton}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
