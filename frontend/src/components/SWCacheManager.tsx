import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';

interface SWCacheManagerProps {
  className?: string;
}

export const SWCacheManager: React.FC<SWCacheManagerProps> = ({ className = '' }) => {
  const { swRegistration, clearCache } = usePWA();
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<string | null>(null);

  const handleClearCache = async () => {
    if (!swRegistration) {
      console.warn('Service Worker not registered');
      return;
    }

    setIsClearing(true);
    try {
      // Limpar cache local
      await clearCache();
      
      // Notificar o backend sobre a limpeza
      await fetch('/api/sw/clear-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear_cache' })
      });

      setLastCleared(new Date().toLocaleString());
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleForceUpdate = async () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return (
    <div className={`sw-cache-manager ${className}`}>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-700">Service Worker Cache</h3>
        
        <div className="flex gap-2">
          <button
            onClick={handleClearCache}
            disabled={isClearing || !swRegistration}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? 'Clearing...' : 'Clear Cache'}
          </button>
          
          <button
            onClick={handleForceUpdate}
            disabled={!swRegistration?.waiting}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Force Update
          </button>
        </div>

        {lastCleared && (
          <p className="text-xs text-gray-500">
            Last cleared: {lastCleared}
          </p>
        )}

        <div className="text-xs text-gray-500">
          Status: {swRegistration ? 'Registered' : 'Not registered'}
        </div>
      </div>
    </div>
  );
};
