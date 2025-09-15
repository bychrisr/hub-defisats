import { useEffect, useState } from 'react';

interface CacheBustingOptions {
  enabled?: boolean;
  interval?: number; // in milliseconds
  onCacheBust?: () => void;
}

export const useCacheBusting = (options: CacheBustingOptions = {}) => {
  const {
    enabled = true,
    interval = 5 * 60 * 1000, // 5 minutes
    onCacheBust,
  } = options;

  const [lastBust, setLastBust] = useState<number>(Date.now());
  const [cacheVersion, setCacheVersion] = useState<string>(Date.now().toString());

  const bustCache = () => {
    const newVersion = Date.now().toString();
    setCacheVersion(newVersion);
    setLastBust(Date.now());

    // Clear local storage cache
    const keysToRemove = Object.keys(localStorage).filter(key =>
      key.startsWith('cache_') ||
      key.startsWith('api_cache_') ||
      key.startsWith('dashboard_cache_')
    );

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear session storage
    const sessionKeysToRemove = Object.keys(sessionStorage).filter(key =>
      key.startsWith('cache_') ||
      key.startsWith('temp_cache_')
    );

    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

    // Call custom callback if provided
    if (onCacheBust) {
      onCacheBust();
    }

    console.log('🧹 Cache busted at:', new Date().toISOString());
  };

  const getCacheBustedUrl = (url: string): string => {
    if (!url) return url;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${cacheVersion}`;
  };

  const getCacheKey = (key: string): string => {
    return `${key}_${cacheVersion}`;
  };

  useEffect(() => {
    if (!enabled) return;

    // Initial cache bust on mount
    bustCache();

    // Set up periodic cache busting
    const intervalId = setInterval(() => {
      bustCache();
    }, interval);

    // Listen for visibility change to bust cache when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastBust = Date.now() - lastBust;
        // If more than 10 minutes since last bust, bust again
        if (timeSinceLastBust > 10 * 60 * 1000) {
          bustCache();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('🌐 Back online - busting cache');
      bustCache();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [enabled, interval]);

  return {
    cacheVersion,
    lastBust,
    bustCache,
    getCacheBustedUrl,
    getCacheKey,
  };
};

// Hook for API calls with cache busting
export const useCacheBustedFetch = (options: CacheBustingOptions = {}) => {
  const { getCacheBustedUrl, cacheVersion } = useCacheBusting(options);

  const fetchWithCacheBust = async (url: string, options?: RequestInit) => {
    const bustedUrl = getCacheBustedUrl(url);
    return fetch(bustedUrl, {
      ...options,
      headers: {
        ...options?.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
  };

  return {
    fetchWithCacheBust,
    cacheVersion,
  };
};

// Hook for local data caching with busting
export const useLocalCache = <T>(key: string, options: CacheBustingOptions = {}) => {
  const { getCacheKey, cacheVersion } = useCacheBusting(options);

  const setCache = (data: T) => {
    try {
      const cacheKey = getCacheKey(key);
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: cacheVersion,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  };

  const getCache = (): T | null => {
    try {
      const cacheKey = getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const cacheData = JSON.parse(cached);

      // Check if cache is still valid (24 hours)
      const isExpired = Date.now() - cacheData.timestamp > 24 * 60 * 60 * 1000;

      if (isExpired) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  };

  const clearCache = () => {
    try {
      const cacheKey = getCacheKey(key);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  };

  return {
    setCache,
    getCache,
    clearCache,
    cacheVersion,
  };
};
