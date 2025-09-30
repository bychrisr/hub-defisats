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
