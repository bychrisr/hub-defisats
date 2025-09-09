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
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const response = await api.post('/validation/username', { username });
      setUsernameAvailable(response.data.available);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  }, []);

  return {
    usernameAvailable,
    usernameChecking,
    checkUsername,
  };
};
