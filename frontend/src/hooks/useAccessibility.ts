import { useState, useEffect, useCallback } from 'react';

interface AccessibilityState {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
}

export const useAccessibility = () => {
  const [state, setState] = useState<AccessibilityState>({
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
    screenReader: false,
    keyboardNavigation: false,
    focusVisible: false,
  });

  // Detectar preferências do sistema
  useEffect(() => {
    // Detectar movimento reduzido
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const setReducedMotion = (matches: boolean) => {
      setState(prev => ({ ...prev, reducedMotion: matches }));
    };

    setReducedMotion(motionMediaQuery.matches);
    motionMediaQuery.addEventListener('change', (e) => setReducedMotion(e.matches));

    // Detectar alto contraste
    const contrastMediaQuery = window.matchMedia('(prefers-contrast: high)');
    const setHighContrast = (matches: boolean) => {
      setState(prev => ({ ...prev, highContrast: matches }));
    };

    setHighContrast(contrastMediaQuery.matches);
    contrastMediaQuery.addEventListener('change', (e) => setHighContrast(e.matches));

    // Detectar leitor de tela
    const detectScreenReader = () => {
      const hasScreenReader = 
        'speechSynthesis' in window ||
        'speechRecognition' in window ||
        navigator.userAgent.includes('NVDA') ||
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver');
      
      setState(prev => ({ ...prev, screenReader: hasScreenReader }));
    };

    detectScreenReader();

    // Detectar navegação por teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setState(prev => ({ ...prev, keyboardNavigation: true }));
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, keyboardNavigation: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    // Carregar configurações salvas
    const savedSettings = localStorage.getItem('axisor-accessibility');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setState(prev => ({ ...prev, ...settings }));
      } catch (error) {
        console.error('Erro ao carregar configurações de acessibilidade:', error);
      }
    }

    return () => {
      motionMediaQuery.removeEventListener('change', (e) => setReducedMotion(e.matches));
      contrastMediaQuery.removeEventListener('change', (e) => setHighContrast(e.matches));
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Salvar configurações
  const saveSettings = useCallback((newSettings: Partial<AccessibilityState>) => {
    const updatedState = { ...state, ...newSettings };
    setState(updatedState);
    
    try {
      localStorage.setItem('axisor-accessibility', JSON.stringify(updatedState));
    } catch (error) {
      console.error('Erro ao salvar configurações de acessibilidade:', error);
    }
  }, [state]);

  // Funções para alterar configurações
  const setFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    saveSettings({ fontSize: size });
  }, [saveSettings]);

  const toggleHighContrast = useCallback(() => {
    saveSettings({ highContrast: !state.highContrast });
  }, [state.highContrast, saveSettings]);

  const toggleFocusVisible = useCallback(() => {
    saveSettings({ focusVisible: !state.focusVisible });
  }, [state.focusVisible, saveSettings]);

  // Aplicar classes CSS baseadas nas configurações
  const getAccessibilityClasses = useCallback(() => {
    const classes = [];

    if (state.reducedMotion) {
      classes.push('reduced-motion');
    }

    if (state.highContrast) {
      classes.push('high-contrast');
    }

    if (state.fontSize === 'large') {
      classes.push('large-text');
    } else if (state.fontSize === 'small') {
      classes.push('small-text');
    }

    if (state.keyboardNavigation) {
      classes.push('keyboard-navigation');
    }

    if (state.focusVisible) {
      classes.push('focus-visible');
    }

    return classes.join(' ');
  }, [state]);

  // Função para anunciar mudanças para leitores de tela
  const announce = useCallback((message: string) => {
    if (state.screenReader) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [state.screenReader]);

  return {
    ...state,
    setFontSize,
    toggleHighContrast,
    toggleFocusVisible,
    getAccessibilityClasses,
    announce,
  };
};

// Hook para gerenciar foco
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  const focusElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.focus();
      setFocusedElement(element);
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    focusedElement,
    focusElement,
    trapFocus,
  };
};
