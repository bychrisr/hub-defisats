import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { ExchangeCredentialsService } from '@/services/exchangeCredentials.service';

export function useLNMarketsCredentials() {
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const checkCredentials = async () => {
      if (user) {
        try {
          setIsLoading(true);
          
          // ✅ NOVA ESTRUTURA: Buscar credenciais da nova estrutura de exchanges
          const lnMarketsCredentials = await ExchangeCredentialsService.getLNMarketsCredentials();
          
          const hasCredentials = !!(lnMarketsCredentials && lnMarketsCredentials.is_active);
          
          console.log('🔍 LN MARKETS CREDENTIALS DEBUG (NEW STRUCTURE):', {
            userId: user.id,
            hasCredentials,
            credentials: lnMarketsCredentials ? {
              id: lnMarketsCredentials.id,
              is_active: lnMarketsCredentials.is_active,
              is_verified: lnMarketsCredentials.is_verified,
              hasApiKey: !!(lnMarketsCredentials.credentials?.api_key),
              hasApiSecret: !!(lnMarketsCredentials.credentials?.api_secret),
              hasPassphrase: !!(lnMarketsCredentials.credentials?.passphrase)
            } : null
          });
          
          setHasCredentials(hasCredentials);
        } catch (error) {
          console.error('❌ LN MARKETS CREDENTIALS - Error checking credentials:', error);
          setHasCredentials(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setHasCredentials(false);
        setIsLoading(false);
      }
    };

    checkCredentials();
  }, [user]);

  return {
    hasCredentials,
    isLoading,
    isConfigured: hasCredentials === true,
    needsConfiguration: hasCredentials === false,
  };
}
