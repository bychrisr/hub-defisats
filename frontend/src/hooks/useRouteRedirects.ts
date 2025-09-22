import { useState, useEffect } from 'react';

interface RouteRedirect {
  from_path: string;
  to_path: string;
  redirect_type: 'temporary' | 'permanent';
}

interface UseRouteRedirectsReturn {
  redirects: RouteRedirect[];
  isLoading: boolean;
  error: string | null;
  checkRedirect: (path: string) => Promise<RouteRedirect | null>;
  refreshRedirects: () => Promise<void>;
}

export const useRouteRedirects = (): UseRouteRedirectsReturn => {
  const [redirects, setRedirects] = useState<RouteRedirect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRedirects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/redirects/active');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setRedirects(data.redirects || []);
    } catch (err) {
      console.error('❌ ROUTE REDIRECTS - Error fetching redirects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch redirects');
    } finally {
      setIsLoading(false);
    }
  };

  const checkRedirect = async (path: string): Promise<RouteRedirect | null> => {
    try {
      const response = await fetch(`/api/redirects/check?path=${encodeURIComponent(path)}`);
      
      if (response.status === 404) {
        return null; // No redirect found
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('❌ ROUTE REDIRECTS - Error checking redirect:', err);
      return null;
    }
  };

  const refreshRedirects = async () => {
    await fetchRedirects();
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  return {
    redirects,
    isLoading,
    error,
    checkRedirect,
    refreshRedirects
  };
};
