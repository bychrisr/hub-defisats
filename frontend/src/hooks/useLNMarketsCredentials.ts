import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

export function useLNMarketsCredentials() {
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      const hasApiKey = !!(user.ln_markets_api_key && user.ln_markets_api_key.length > 0);
      const hasApiSecret = !!(user.ln_markets_api_secret && user.ln_markets_api_secret.length > 0);
      const hasPassphrase = !!(user.ln_markets_passphrase && user.ln_markets_passphrase.length > 0);
      
      const allCredentials = hasApiKey && hasApiSecret && hasPassphrase;
      
      // ✅ DEBUG: Verificar credenciais do usuário
      console.log('🔍 LN MARKETS CREDENTIALS DEBUG:', {
        userId: user.id,
        hasApiKey,
        hasApiSecret,
        hasPassphrase,
        allCredentials,
        apiKeyLength: user.ln_markets_api_key?.length || 0,
        apiSecretLength: user.ln_markets_api_secret?.length || 0,
        passphraseLength: user.ln_markets_passphrase?.length || 0
      });
      
      setHasCredentials(allCredentials);
      setIsLoading(false);
    } else {
      setHasCredentials(false);
      setIsLoading(false);
    }
  }, [user]);

  return {
    hasCredentials,
    isLoading,
    isConfigured: hasCredentials === true,
    needsConfiguration: hasCredentials === false,
  };
}
