// src/hooks/useResizeObserver.ts
import { useEffect, useRef } from 'react';

export function useResizeObserver(callback: (entry: ResizeObserverEntry) => void) {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        callback(entry);
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [callback]);

  return elementRef;
}
