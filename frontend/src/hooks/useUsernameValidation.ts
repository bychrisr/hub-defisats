import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface UseUsernameValidationReturn {
  usernameAvailable: boolean | null;
  usernameChecking: boolean;
  checkUsername: (username: string) => void;
}

export const useUsernameValidation = (): UseUsernameValidationReturn => {
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [usernameChecking, setUsernameChecking] = useState(false);

  const checkUsername = useCallback(async (username: string) => {
    console.log('🔄 USERNAME VALIDATION - Starting check for:', username);
    
    if (!username || username.length < 3) {
      console.log('🔄 USERNAME VALIDATION - Username too short, setting to null');
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }

    // Validação local para @ e domínios de email
    if (username.includes('@')) {
      console.log('🔄 USERNAME VALIDATION - Username contains @, setting to false');
      setUsernameAvailable(false);
      setUsernameChecking(false);
      return;
    }

    // Verificar se termina com domínios de email
    const emailDomainRegex = /\.(com|com\.br|org|net|edu|gov|mil|int|co\.uk|co\.jp|co\.kr|co\.in|co\.za|co\.nz|com\.au|com\.mx|com\.ar|com\.pe|com\.co|com\.ve|org\.br|net\.br|edu\.br|gov\.br|mil\.br|info|biz|name|pro|aero|coop|museum|travel|jobs|mobi|tel|asia|cat|post|xxx|arpa|local|test|example|invalid)$/i;
    if (emailDomainRegex.test(username)) {
      console.log('🔄 USERNAME VALIDATION - Username ends with email domain, setting to false');
      setUsernameAvailable(false);
      setUsernameChecking(false);
      return;
    }

    console.log('🔄 USERNAME VALIDATION - Setting checking to true');
    setUsernameChecking(true);
    
    try {
      console.log('🔄 USERNAME VALIDATION - Making API call...');
      const response = await api.post('/api/validation/username', { username });
      console.log('🔄 USERNAME VALIDATION - API response:', response.data);
      setUsernameAvailable(response.data.available);
    } catch (error) {
      console.error('❌ USERNAME VALIDATION - Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      console.log('🔄 USERNAME VALIDATION - Setting checking to false');
      setUsernameChecking(false);
    }
  }, []);

  return {
    usernameAvailable,
    usernameChecking,
    checkUsername,
  };
};
